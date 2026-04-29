-- =============================================================================
-- Migracion 005: panel administrativo (Area Reservada)
-- =============================================================================
-- Objetivo:
--   Sentar las bases para el panel privado del sitio. Incluye:
--   1. Tabla `public.perfiles` (extiende auth.users con rol).
--   2. Roles: alumno, docente, admin, super_admin.
--   3. Trigger que crea automaticamente un perfil cuando alguien se registra
--      en Supabase Auth (auth.users).
--   4. Helpers `public.es_admin()` y `public.es_super_admin()` para usar en
--      RLS y en RPCs.
--   5. Columnas de respuesta en `mensajes_contacto` (respondido,
--      respondido_en, respondido_por, respuesta_asunto, respuesta_cuerpo).
--   6. RLS abiertas a admins/super_admins en `mensajes_contacto` y
--      `perfiles`.
--   7. Vista `mensajes_contacto_pendientes` para la bandeja del panel.
--   8. Funcion `marcar_mensaje_respondido(...)` que solo admins pueden llamar
--      (la usa la edge function que envia la respuesta).
--
-- Idempotente: todo `create ... if not exists` / `or replace`. Se puede
-- correr varias veces sin romper nada.
--
-- Como crear el primer admin (super_admin) DESPUES de correr esta migracion:
--   1. Crear el usuario en Auth -> Users -> "Add user" (tradicion@...).
--   2. Correr en SQL Editor:
--        update public.perfiles
--           set rol = 'super_admin'
--         where email = 'tradicionmisticayhermetica@gmail.com';
--   3. Listo: ese usuario ya tiene acceso a /area-reservada.
-- =============================================================================

-- =============================================================================
-- 1. Tabla public.perfiles
-- =============================================================================
-- Cada fila se vincula 1:1 con un usuario de auth.users (Supabase Auth).
-- El campo `rol` define que puede hacer en el panel.
create table if not exists public.perfiles (
    id          uuid primary key references auth.users(id) on delete cascade,
    email       citext not null,
    nombre      text,
    apellido    text,
    rol         text not null default 'alumno'
                check (rol in ('alumno', 'docente', 'admin', 'super_admin')),
    activo      boolean not null default true,
    creado_en   timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

comment on table public.perfiles is
    'Extiende auth.users con metadata de la app (rol, nombre, apellido, activo).';
comment on column public.perfiles.rol is
    'alumno | docente | admin | super_admin. Solo admin/super_admin acceden al panel.';

create index if not exists perfiles_email_idx on public.perfiles (email);
create index if not exists perfiles_rol_idx on public.perfiles (rol);

alter table public.perfiles enable row level security;

-- =============================================================================
-- 2. Helpers de rol (security definer): es_admin / es_super_admin
-- =============================================================================
-- Los usamos en RLS y en RPCs. Definer para que puedan leer perfiles aunque
-- el llamador no tenga policy de SELECT directa.
create or replace function public.es_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1 from public.perfiles
         where id = auth.uid()
           and activo = true
           and rol in ('admin', 'super_admin')
    );
$$;

create or replace function public.es_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1 from public.perfiles
         where id = auth.uid()
           and activo = true
           and rol = 'super_admin'
    );
$$;

revoke all on function public.es_admin() from public;
revoke all on function public.es_super_admin() from public;
grant execute on function public.es_admin() to anon, authenticated;
grant execute on function public.es_super_admin() to anon, authenticated;

-- =============================================================================
-- 3. Trigger: crear perfil al registrarse un usuario en auth.users
-- =============================================================================
create or replace function public.handle_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.perfiles (id, email, nombre, apellido, rol)
    values (
        new.id,
        new.email,
        coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1)),
        nullif(trim(new.raw_user_meta_data->>'apellido'), ''),
        coalesce(nullif(trim(new.raw_user_meta_data->>'rol'), ''), 'alumno')
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_nuevo_usuario();

-- =============================================================================
-- 4. RLS de public.perfiles
-- =============================================================================
-- - Cada usuario lee y actualiza su propio perfil.
-- - Admins leen y actualizan todos.
-- - Solo super_admin puede cambiar el rol o desactivar usuarios (controlado a
--   nivel de UI; aca dejamos que admin pueda update general).
drop policy if exists perfiles_self_select on public.perfiles;
create policy perfiles_self_select on public.perfiles
    for select using (id = auth.uid() or public.es_admin());

drop policy if exists perfiles_self_update on public.perfiles;
create policy perfiles_self_update on public.perfiles
    for update using (id = auth.uid() or public.es_admin())
    with check (id = auth.uid() or public.es_admin());

-- =============================================================================
-- 5. Columnas de respuesta en mensajes_contacto
-- =============================================================================
alter table public.mensajes_contacto
    add column if not exists respondido boolean not null default false;

alter table public.mensajes_contacto
    add column if not exists respondido_en timestamptz;

alter table public.mensajes_contacto
    add column if not exists respondido_por uuid references auth.users(id);

alter table public.mensajes_contacto
    add column if not exists respuesta_asunto text;

alter table public.mensajes_contacto
    add column if not exists respuesta_cuerpo text;

create index if not exists mensajes_contacto_respondido_idx
    on public.mensajes_contacto (respondido, creado_en desc);

-- =============================================================================
-- 6. RLS de mensajes_contacto: admins pueden leer/actualizar
-- =============================================================================
drop policy if exists mensajes_admin_select on public.mensajes_contacto;
create policy mensajes_admin_select on public.mensajes_contacto
    for select using (public.es_admin());

drop policy if exists mensajes_admin_update on public.mensajes_contacto;
create policy mensajes_admin_update on public.mensajes_contacto
    for update using (public.es_admin())
    with check (public.es_admin());

-- =============================================================================
-- 7. Vista: mensajes_contacto_pendientes
-- =============================================================================
-- Bandeja por defecto del panel. Filtra por respondido = false.
-- security_invoker = true para que respete las RLS del que consulta.
create or replace view public.mensajes_contacto_pendientes
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
    m.contacto_id
from public.mensajes_contacto m
where m.respondido = false
order by m.creado_en desc;

comment on view public.mensajes_contacto_pendientes is
    'Mensajes del formulario que todavia no fueron respondidos. Solo visibles para admins (vista security_invoker).';

-- =============================================================================
-- 8. RPC: marcar_mensaje_respondido
-- =============================================================================
-- Llamada por la edge function `responder-mensaje` despues de enviar el mail
-- via Resend. Solo admins. Devuelve jsonb {ok, mensaje_id} o {ok:false, ...}.
create or replace function public.marcar_mensaje_respondido(
    p_mensaje_id     uuid,
    p_asunto         text,
    p_cuerpo         text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid;
begin
    v_uid := auth.uid();

    if v_uid is null then
        return jsonb_build_object('ok', false, 'error', 'no_autenticado');
    end if;

    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'sin_permisos');
    end if;

    if p_asunto is null or length(trim(p_asunto)) < 2 then
        return jsonb_build_object('ok', false, 'error', 'asunto_invalido');
    end if;

    if p_cuerpo is null or length(trim(p_cuerpo)) < 5 then
        return jsonb_build_object('ok', false, 'error', 'cuerpo_invalido');
    end if;

    update public.mensajes_contacto
       set respondido       = true,
           respondido_en    = now(),
           respondido_por   = v_uid,
           respuesta_asunto = trim(p_asunto),
           respuesta_cuerpo = p_cuerpo
     where id = p_mensaje_id;

    if not found then
        return jsonb_build_object('ok', false, 'error', 'mensaje_no_encontrado');
    end if;

    return jsonb_build_object('ok', true, 'mensaje_id', p_mensaje_id);
exception
    when others then
        return jsonb_build_object(
            'ok', false,
            'error', 'error_interno',
            'error_detalle', sqlerrm,
            'error_state', sqlstate
        );
end;
$$;

revoke all on function public.marcar_mensaje_respondido(uuid, text, text) from public;
grant execute on function public.marcar_mensaje_respondido(uuid, text, text) to authenticated;

comment on function public.marcar_mensaje_respondido is
    'Marca un mensaje como respondido y guarda asunto/cuerpo de la respuesta. Solo admins.';

-- =============================================================================
-- 9. Vista de resumen para el dashboard
-- =============================================================================
create or replace view public.panel_resumen
with (security_invoker = true) as
select
    (select count(*) from public.mensajes_contacto where respondido = false) as mensajes_pendientes,
    (select count(*) from public.mensajes_contacto where respondido = true) as mensajes_respondidos,
    (select count(*) from public.mensajes_contacto where creado_en > now() - interval '7 days') as mensajes_ultima_semana,
    (select count(*) from public.contactos) as total_contactos,
    (select count(*) from public.contactos where newsletter_optin = true) as suscriptores_newsletter;

comment on view public.panel_resumen is
    'Numeros agregados para el dashboard del panel. Solo visibles para admins (RLS en tablas base).';

-- =============================================================================
-- Smoke test (descomentar para probar despues de crear un admin)
-- =============================================================================
-- select * from public.panel_resumen;
-- select * from public.mensajes_contacto_pendientes limit 5;
-- select public.es_admin();
