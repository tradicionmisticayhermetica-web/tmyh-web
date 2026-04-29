-- =============================================================================
-- Migracion 002: mensajes de contacto (formulario del sitio)
-- =============================================================================
-- Objetivo:
--   Permitir que el formulario publico de /contacto guarde leads en Supabase
--   SIN exponer INSERT directo a las tablas. Todo pasa por una RPC con
--   `security definer` que valida, des-duplica, aplica rate-limit y escribe
--   en `contactos` + `mensajes_contacto`.
--
-- Diseno:
--   - Tabla nueva `mensajes_contacto`: un mensaje por fila (historial).
--     Vinculada a `contactos.id` via FK (upsert del contacto al insertar).
--   - Funcion `enviar_mensaje_contacto(...)` expuesta a `anon` y
--     `authenticated`. Limita a 5 mensajes por email por dia.
--   - El cliente del sitio (browser con anon key) solo puede EJECUTAR la
--     funcion, no tocar las tablas directamente.
--
-- Seguridad:
--   - Las tablas siguen con RLS activo y sin policies abiertas (del schema
--     original). La funcion corre como el owner (definer), asi que puede
--     escribir igual.
--   - Validacion de formato de email hecha adentro de la funcion.
--   - Rate-limit por email: max 5 mensajes/24h (ajustable).
--   - Se guarda `origen` (ej: 'web:contacto') para trazabilidad.
--
-- Segura e idempotente: todo `create ... if not exists` / `or replace`.
-- Copiar en Supabase -> SQL Editor -> Run.
-- =============================================================================

-- =============================================================================
-- Pre-requisitos: columnas de newsletter en `contactos`
-- =============================================================================
-- Normalmente vienen de `001_newsletter.sql`. Las agregamos tambien aca con
-- IF NOT EXISTS para que la 002 sea auto-contenida: correrla sola basta para
-- que la funcion funcione, hayas o no corrido la 001.
-- =============================================================================
alter table public.contactos
    add column if not exists newsletter_optin boolean not null default false;

alter table public.contactos
    add column if not exists newsletter_optin_fecha timestamptz;

alter table public.contactos
    add column if not exists etiquetas text[] not null default '{}';

-- =============================================================================
-- Tabla: mensajes_contacto
-- =============================================================================
create table if not exists public.mensajes_contacto (
    id             uuid primary key default gen_random_uuid(),
    contacto_id    uuid not null references public.contactos(id) on delete cascade,
    nombre         text not null,
    apellido       text,
    email          citext not null,
    telefono       text,
    curso_interes  text,
    mensaje        text not null,
    origen         text not null default 'web:contacto',
    -- Hash de IP (sha256) si el cliente lo provee. No guardamos IP raw por
    -- privacidad/GDPR; solo el hash sirve para rate-limit/abuse.
    ip_hash        text,
    user_agent     text,
    newsletter_optin boolean not null default false,
    creado_en      timestamptz not null default now()
);

comment on table public.mensajes_contacto is
    'Historial de mensajes enviados desde el formulario publico. Un mensaje por fila.';
comment on column public.mensajes_contacto.origen is
    'De donde viene el mensaje. Ej: web:contacto, web:newsletter, admin:manual.';
comment on column public.mensajes_contacto.ip_hash is
    'SHA-256 de la IP del cliente (opcional). Se usa para detectar abuso sin guardar IP en claro.';

create index if not exists mensajes_contacto_contacto_idx
    on public.mensajes_contacto (contacto_id);
create index if not exists mensajes_contacto_creado_idx
    on public.mensajes_contacto (creado_en desc);
create index if not exists mensajes_contacto_email_creado_idx
    on public.mensajes_contacto (email, creado_en desc);

alter table public.mensajes_contacto enable row level security;

-- No agregamos policies: solo el service_role puede leer; anon accede via RPC.

-- =============================================================================
-- Funcion RPC: enviar_mensaje_contacto
-- =============================================================================
-- Uso desde el cliente (supabase-js en el navegador):
--
--   await supabase.rpc('enviar_mensaje_contacto', {
--     p_nombre: 'Ana',
--     p_apellido: 'Perez',
--     p_email: 'ana@example.com',
--     p_telefono: '+54 11 ...',
--     p_curso_interes: 'Curso de Simbologia',
--     p_mensaje: 'Hola, quiero saber mas...',
--     p_newsletter_optin: true,
--     p_ip_hash: null,      -- opcional
--     p_user_agent: 'Mozilla/5.0 ...'  -- opcional
--   });
--
-- Retorna: jsonb con {ok: true, mensaje_id: uuid} en exito,
--          o {ok: false, error: 'motivo'} si falla validacion/rate-limit.
-- =============================================================================
create or replace function public.enviar_mensaje_contacto(
    p_nombre            text,
    p_email             text,
    p_mensaje           text,
    p_apellido          text default null,
    p_telefono          text default null,
    p_curso_interes     text default null,
    p_newsletter_optin  boolean default false,
    p_ip_hash           text default null,
    p_user_agent        text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_contacto_id  uuid;
    v_mensaje_id   uuid;
    v_email_clean  citext;
    v_nombre_clean text;
    v_count_24h    int;
begin
    -- ------------------------------------------------------------------
    -- Normalizacion + validacion basica
    -- ------------------------------------------------------------------
    v_email_clean  := lower(trim(p_email));
    v_nombre_clean := trim(p_nombre);

    if v_nombre_clean is null or length(v_nombre_clean) < 2 then
        return jsonb_build_object('ok', false, 'error', 'nombre_invalido');
    end if;

    if v_email_clean is null or v_email_clean = '' then
        return jsonb_build_object('ok', false, 'error', 'email_vacio');
    end if;

    -- Regex razonable para emails (no es el RFC completo pero filtra 99%).
    if v_email_clean::text !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' then
        return jsonb_build_object('ok', false, 'error', 'email_invalido');
    end if;

    if p_mensaje is null or length(trim(p_mensaje)) < 5 then
        return jsonb_build_object('ok', false, 'error', 'mensaje_muy_corto');
    end if;

    -- Limite de longitud razonable para evitar spam masivo.
    if length(p_mensaje) > 5000 then
        return jsonb_build_object('ok', false, 'error', 'mensaje_muy_largo');
    end if;

    -- ------------------------------------------------------------------
    -- Rate-limit: max 5 mensajes por email en 24h
    -- ------------------------------------------------------------------
    select count(*)
      into v_count_24h
      from public.mensajes_contacto
     where email = v_email_clean
       and creado_en > now() - interval '24 hours';

    if v_count_24h >= 5 then
        return jsonb_build_object('ok', false, 'error', 'limite_diario');
    end if;

    -- Rate-limit adicional por IP-hash (si viene): max 10/24h.
    if p_ip_hash is not null then
        select count(*)
          into v_count_24h
          from public.mensajes_contacto
         where ip_hash = p_ip_hash
           and creado_en > now() - interval '24 hours';

        if v_count_24h >= 10 then
            return jsonb_build_object('ok', false, 'error', 'limite_ip');
        end if;
    end if;

    -- ------------------------------------------------------------------
    -- Upsert del contacto (crea o actualiza datos faltantes)
    -- ------------------------------------------------------------------
    insert into public.contactos (email, nombre, apellido, telefono)
    values (v_email_clean, v_nombre_clean, nullif(trim(coalesce(p_apellido, '')), ''), nullif(trim(coalesce(p_telefono, '')), ''))
    on conflict (email) do update set
        nombre   = coalesce(public.contactos.nombre, excluded.nombre),
        apellido = coalesce(public.contactos.apellido, excluded.apellido),
        telefono = coalesce(public.contactos.telefono, excluded.telefono)
    returning id into v_contacto_id;

    -- Si el contacto consintio newsletter, lo registramos en la tabla
    -- contactos. Si ya estaba true, no pisa la fecha original.
    if p_newsletter_optin then
        update public.contactos
           set newsletter_optin       = true,
               newsletter_optin_fecha = coalesce(newsletter_optin_fecha, now())
         where id = v_contacto_id
           and newsletter_optin = false;
    end if;

    -- ------------------------------------------------------------------
    -- Insertar mensaje
    -- ------------------------------------------------------------------
    insert into public.mensajes_contacto (
        contacto_id, nombre, apellido, email, telefono,
        curso_interes, mensaje, ip_hash, user_agent, newsletter_optin
    )
    values (
        v_contacto_id,
        v_nombre_clean,
        nullif(trim(coalesce(p_apellido, '')), ''),
        v_email_clean,
        nullif(trim(coalesce(p_telefono, '')), ''),
        nullif(trim(coalesce(p_curso_interes, '')), ''),
        trim(p_mensaje),
        p_ip_hash,
        p_user_agent,
        coalesce(p_newsletter_optin, false)
    )
    returning id into v_mensaje_id;

    return jsonb_build_object('ok', true, 'mensaje_id', v_mensaje_id);
exception
    when others then
        -- Devolvemos tambien el sqlerrm para debug. El contenido es texto
        -- tecnico de Postgres (nombre de columna faltante, constraint, etc.);
        -- no filtra datos de usuarios. Si mas adelante quisieras ocultarlo en
        -- produccion, basta con dejar solo el 'error_interno' y logear
        -- `raise log ...` aca.
        return jsonb_build_object(
            'ok', false,
            'error', 'error_interno',
            'error_detalle', sqlerrm,
            'error_state', sqlstate
        );
end;
$$;

comment on function public.enviar_mensaje_contacto is
    'RPC publica para el formulario de contacto del sitio. Valida, des-duplica contactos por email, aplica rate-limit y registra mensaje. Corre como definer para poder escribir pese al RLS de las tablas.';

-- =============================================================================
-- Permisos: solo EXECUTE para anon y authenticated
-- =============================================================================
-- Revocamos primero para ser explicitos.
revoke all on function public.enviar_mensaje_contacto(
    text, text, text, text, text, text, boolean, text, text
) from public;

grant execute on function public.enviar_mensaje_contacto(
    text, text, text, text, text, text, boolean, text, text
) to anon, authenticated;

-- =============================================================================
-- Vista util (admin): ultimos mensajes con datos del contacto
-- =============================================================================
create or replace view public.mensajes_contacto_recientes
with (security_invoker = true) as
select
    m.id,
    m.creado_en,
    m.nombre,
    m.apellido,
    m.email,
    m.telefono,
    m.curso_interes,
    m.mensaje,
    m.newsletter_optin,
    m.origen,
    c.id   as contacto_id,
    c.creado_en as contacto_desde
from public.mensajes_contacto m
join public.contactos c on c.id = m.contacto_id
order by m.creado_en desc;

comment on view public.mensajes_contacto_recientes is
    'Ultimos mensajes del formulario con datos del contacto. Solo accesible para service_role (RLS).';

-- =============================================================================
-- Smoke test (comentado). Descomentar para probar manualmente en el editor:
-- =============================================================================
-- select public.enviar_mensaje_contacto(
--     p_nombre => 'Juan Prueba',
--     p_email  => 'juan.prueba@example.com',
--     p_mensaje => 'Este es un mensaje de prueba de la migracion 002.',
--     p_curso_interes => 'Heka',
--     p_newsletter_optin => true
-- );
--
-- select * from public.mensajes_contacto_recientes limit 5;
