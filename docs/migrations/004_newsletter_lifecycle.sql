-- =============================================================================
-- Migracion 004: lifecycle del newsletter (opt-in / opt-out / historial)
-- =============================================================================
-- Objetivo:
--   Soportar el ciclo completo de suscripcion al newsletter:
--     - Un solo flag `newsletter_optin` en contactos (true = en la lista).
--     - Token unico por contacto para unsubscribe con un click (sin login).
--     - Tabla de eventos para trazabilidad legal (ley 25.326 / GDPR).
--     - RPCs `newsletter_unsubscribe` y `newsletter_resubscribe` expuestas a
--       `anon` para que el visitante gestione su estado con el token.
--
-- Diseno:
--   - `contactos.newsletter_optin` (boolean, ya existe desde 002).
--   - `contactos.newsletter_optin_fecha` (ya existe).
--   - `contactos.newsletter_optout_fecha` NUEVA: fecha de la ultima baja.
--   - `contactos.newsletter_token_unsubscribe` NUEVA: uuid unico del
--     contacto, se pone en cada link de unsubscribe de los emails.
--   - `newsletter_eventos` NUEVA: un registro por cada cambio de estado.
--
-- Seguridad:
--   - RPCs corren con security definer (salta RLS para poder escribir).
--   - El token es secreto razonable: un UUID v4 aleatorio (128 bits). Si se
--     regenera, los links viejos dejan de funcionar (util para "cambiar
--     todos los tokens" si hubo una fuga).
--
-- Segura e idempotente. Copiar en Supabase -> SQL Editor -> Run.
-- =============================================================================

-- =============================================================================
-- Columnas nuevas en `contactos`
-- =============================================================================
alter table public.contactos
    add column if not exists newsletter_optout_fecha timestamptz;

alter table public.contactos
    add column if not exists newsletter_token_unsubscribe uuid
        not null default gen_random_uuid();

-- Indice unico para lookup rapido por token
create unique index if not exists contactos_token_unsubscribe_idx
    on public.contactos (newsletter_token_unsubscribe);

comment on column public.contactos.newsletter_optout_fecha is
    'Fecha de la ultima vez que el contacto se desuscribio. NULL si nunca se desuscribio.';
comment on column public.contactos.newsletter_token_unsubscribe is
    'UUID secreto del contacto. Va en los links de unsubscribe. Regenerable via rotate_unsubscribe_token si hay fuga.';

-- Contactos que existian antes de esta migracion ya recibieron un token
-- default en el ADD COLUMN. Verificamos por las dudas:
update public.contactos
   set newsletter_token_unsubscribe = gen_random_uuid()
 where newsletter_token_unsubscribe is null;

-- =============================================================================
-- Tabla: newsletter_eventos (historial)
-- =============================================================================
create table if not exists public.newsletter_eventos (
    id             uuid primary key default gen_random_uuid(),
    contacto_id    uuid not null references public.contactos(id) on delete cascade,
    tipo           text not null
                     check (tipo in (
                         'subscribed',        -- alta (primer opt-in)
                         'resubscribed',      -- volvio tras una baja
                         'unsubscribed',      -- baja explicita del usuario
                         'bounced',           -- el email rebota (hard bounce)
                         'complained',        -- marco como spam
                         'admin_added',       -- alta manual desde admin
                         'admin_removed'      -- baja manual desde admin
                     )),
    motivo         text,   -- texto libre opcional (razon que puso el usuario)
    origen         text,   -- 'web:contacto', 'web:unsubscribe', 'admin', 'resend:webhook'
    user_agent     text,
    ip_hash        text,
    creado_en      timestamptz not null default now()
);

comment on table public.newsletter_eventos is
    'Historial de cambios de estado del newsletter por contacto. Un registro por evento.';

create index if not exists newsletter_eventos_contacto_idx
    on public.newsletter_eventos (contacto_id, creado_en desc);
create index if not exists newsletter_eventos_tipo_idx
    on public.newsletter_eventos (tipo);

alter table public.newsletter_eventos enable row level security;

-- =============================================================================
-- Vista admin: estado actual + historial resumido
-- =============================================================================
create or replace view public.newsletter_suscriptores
with (security_invoker = true) as
select
    c.id,
    c.email,
    c.nombre,
    c.apellido,
    c.newsletter_optin,
    c.newsletter_optin_fecha,
    c.newsletter_optout_fecha,
    c.newsletter_token_unsubscribe,
    (
      select count(*) from public.newsletter_eventos e
       where e.contacto_id = c.id and e.tipo = 'unsubscribed'
    ) as veces_desuscrito,
    c.creado_en as contacto_desde
from public.contactos c
where c.newsletter_optin = true;

comment on view public.newsletter_suscriptores is
    'Lista activa para enviar newsletter (todos los que tienen optin=true). Accesible solo con service_role.';

-- =============================================================================
-- RPC: newsletter_unsubscribe (publica, via token)
-- =============================================================================
-- Uso desde el cliente:
--   await supabase.rpc('newsletter_unsubscribe', {
--     p_token: '<uuid-del-link>',
--     p_motivo: 'no quiero mas'   -- opcional
--   });
--
-- Retorna jsonb:
--   {ok:true, email:'ana@...', ya_estaba_desuscripto:false}
--   {ok:false, error:'token_invalido'}
-- =============================================================================
create or replace function public.newsletter_unsubscribe(
    p_token       uuid,
    p_motivo      text default null,
    p_user_agent  text default null,
    p_ip_hash     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_contacto  record;
    v_ya_estaba boolean;
begin
    if p_token is null then
        return jsonb_build_object('ok', false, 'error', 'token_faltante');
    end if;

    select id, email, newsletter_optin
      into v_contacto
      from public.contactos
     where newsletter_token_unsubscribe = p_token
     limit 1;

    if v_contacto.id is null then
        return jsonb_build_object('ok', false, 'error', 'token_invalido');
    end if;

    v_ya_estaba := not v_contacto.newsletter_optin;

    if not v_ya_estaba then
        update public.contactos
           set newsletter_optin         = false,
               newsletter_optout_fecha  = now()
         where id = v_contacto.id;

        insert into public.newsletter_eventos (
            contacto_id, tipo, motivo, origen, user_agent, ip_hash
        ) values (
            v_contacto.id, 'unsubscribed',
            nullif(trim(coalesce(p_motivo, '')), ''),
            'web:unsubscribe',
            p_user_agent, p_ip_hash
        );
    end if;

    return jsonb_build_object(
        'ok', true,
        'email', v_contacto.email,
        'ya_estaba_desuscripto', v_ya_estaba
    );
exception
    when others then
        return jsonb_build_object(
            'ok', false,
            'error', 'error_interno',
            'error_detalle', sqlerrm
        );
end;
$$;

comment on function public.newsletter_unsubscribe is
    'Da de baja a un contacto del newsletter usando su token. Registra evento para trazabilidad.';

-- =============================================================================
-- RPC: newsletter_resubscribe (publica, via token)
-- =============================================================================
-- Util cuando alguien que se desuscribio cambia de idea. El link a
-- /newsletter/preferencias?token=xxx le permite volver a activarse.
-- =============================================================================
create or replace function public.newsletter_resubscribe(
    p_token       uuid,
    p_user_agent  text default null,
    p_ip_hash     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_contacto record;
    v_tipo text;
begin
    if p_token is null then
        return jsonb_build_object('ok', false, 'error', 'token_faltante');
    end if;

    select id, email, newsletter_optin, newsletter_optout_fecha
      into v_contacto
      from public.contactos
     where newsletter_token_unsubscribe = p_token
     limit 1;

    if v_contacto.id is null then
        return jsonb_build_object('ok', false, 'error', 'token_invalido');
    end if;

    if v_contacto.newsletter_optin then
        return jsonb_build_object(
            'ok', true,
            'email', v_contacto.email,
            'ya_estaba_suscripto', true
        );
    end if;

    -- Si ya se habia desuscripto antes, es un "resubscribed"; si nunca se
    -- habia dado de alta, es un "subscribed".
    v_tipo := case
        when v_contacto.newsletter_optout_fecha is not null then 'resubscribed'
        else 'subscribed'
    end;

    update public.contactos
       set newsletter_optin        = true,
           newsletter_optin_fecha  = coalesce(newsletter_optin_fecha, now())
     where id = v_contacto.id;

    insert into public.newsletter_eventos (
        contacto_id, tipo, origen, user_agent, ip_hash
    ) values (
        v_contacto.id, v_tipo, 'web:preferencias', p_user_agent, p_ip_hash
    );

    return jsonb_build_object(
        'ok', true,
        'email', v_contacto.email,
        'ya_estaba_suscripto', false
    );
exception
    when others then
        return jsonb_build_object(
            'ok', false,
            'error', 'error_interno',
            'error_detalle', sqlerrm
        );
end;
$$;

comment on function public.newsletter_resubscribe is
    'Reactiva la suscripcion al newsletter usando el token. Registra evento.';

-- =============================================================================
-- RPC: newsletter_estado (publica, via token)
-- =============================================================================
-- Para que la pagina /newsletter/preferencias pueda mostrar el estado actual
-- y el email ofuscado al visitante antes de que confirme una accion.
-- =============================================================================
create or replace function public.newsletter_estado(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_contacto record;
begin
    select id, email, newsletter_optin, newsletter_optin_fecha,
           newsletter_optout_fecha
      into v_contacto
      from public.contactos
     where newsletter_token_unsubscribe = p_token
     limit 1;

    if v_contacto.id is null then
        return jsonb_build_object('ok', false, 'error', 'token_invalido');
    end if;

    return jsonb_build_object(
        'ok', true,
        'email', v_contacto.email,
        'suscripto', v_contacto.newsletter_optin,
        'desde', v_contacto.newsletter_optin_fecha,
        'baja', v_contacto.newsletter_optout_fecha
    );
end;
$$;

comment on function public.newsletter_estado is
    'Lee el estado actual del newsletter para un token. Solo lectura.';

-- =============================================================================
-- Permisos: anon puede ejecutar las 3 RPCs
-- =============================================================================
revoke all on function public.newsletter_unsubscribe(uuid, text, text, text)
    from public;
revoke all on function public.newsletter_resubscribe(uuid, text, text)
    from public;
revoke all on function public.newsletter_estado(uuid) from public;

grant execute on function public.newsletter_unsubscribe(uuid, text, text, text)
    to anon, authenticated;
grant execute on function public.newsletter_resubscribe(uuid, text, text)
    to anon, authenticated;
grant execute on function public.newsletter_estado(uuid)
    to anon, authenticated;

-- =============================================================================
-- OPT-IN MASIVO DE CONTACTOS EXISTENTES  (bloque comentado, leer antes!)
-- =============================================================================
--
--   >>> ADVERTENCIA LEGAL (ley 25.326 Argentina / GDPR):
--   >>> Marcar a los ~2000 contactos migrados como suscriptos al newsletter
--   >>> sin que hayan dado consentimiento explicito para recibir marketing
--   >>> tiene riesgo legal. Si denuncian que nunca autorizaron, no hay como
--   >>> probar el consentimiento.
--   >>>
--   >>> Alternativa recomendada: mandales un primer "email de bienvenida"
--   >>> con un link claro de unsubscribe (la mision de nuestra plantilla
--   >>> HTML + la pagina /newsletter/unsubscribe ya cubre esto). Los que
--   >>> no quieren, se dan de baja con un click. Esto es defendible.
--   >>>
--   >>> Si decidis hacerlo igual, descomentar los dos statements de abajo
--   >>> y correrlos una sola vez:
--
-- update public.contactos
--    set newsletter_optin       = true,
--        newsletter_optin_fecha = coalesce(newsletter_optin_fecha, now())
--  where newsletter_optin = false;
--
-- insert into public.newsletter_eventos (contacto_id, tipo, origen, motivo)
-- select id, 'admin_added', 'migration:003',
--        'Opt-in masivo de contactos migrados. Decision del admin.'
--   from public.contactos
--  where newsletter_optin = true
--    and not exists (
--        select 1 from public.newsletter_eventos
--         where contacto_id = contactos.id and tipo in ('subscribed','resubscribed','admin_added')
--    );

-- =============================================================================
-- Smoke test (comentado). Descomentar y correr para probar:
-- =============================================================================
-- -- 1) Tomar un contacto de prueba y su token:
-- select id, email, newsletter_optin, newsletter_token_unsubscribe
--   from public.contactos where email = 'juan.prueba@example.com';
--
-- -- 2) Darlo de baja con el token (reemplazar <token>):
-- select public.newsletter_unsubscribe(
--     p_token => '<token-uuid-de-arriba>',
--     p_motivo => 'probando la migracion 003'
-- );
--
-- -- 3) Ver el evento en la tabla de historial:
-- select * from public.newsletter_eventos order by creado_en desc limit 5;
--
-- -- 4) Volver a activar:
-- select public.newsletter_resubscribe(
--     p_token => '<token-uuid>'
-- );
--
-- -- 5) Ver estado:
-- select public.newsletter_estado(p_token => '<token-uuid>');
