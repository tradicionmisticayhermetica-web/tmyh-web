-- =============================================================================
-- Migracion XXX: <descripcion corta del cambio>
-- =============================================================================
-- Objetivo:
--   <Para que se hace este cambio. El "por que" del negocio.>
--
-- Cambios principales:
--   - Tabla nueva: <nombre>.
--   - <Otros cambios si los hubiera>.
--
-- Aplicacion: idempotente. Pegar en SQL Editor del dashboard y ejecutar.
-- =============================================================================


-- =============================================================================
-- 1. Tabla
-- =============================================================================
create table if not exists public.ejemplo_recurso (
    id          uuid primary key default gen_random_uuid(),
    nombre      text not null,
    descripcion text,
    estado      text not null default 'activo'
                  check (estado in ('activo', 'archivado')),

    -- Audit
    creado_en       timestamptz not null default now(),
    actualizado_en  timestamptz not null default now(),
    creado_por      uuid references public.perfiles(id) on delete set null
);

comment on table public.ejemplo_recurso is
    'Describe en una linea para que sirve esta tabla.';

create index if not exists ejemplo_recurso_estado_idx
    on public.ejemplo_recurso (estado, creado_en desc);


-- =============================================================================
-- 2. Trigger de actualizado_en (opcional)
-- =============================================================================
create or replace function public.set_ejemplo_recurso_actualizado_en()
returns trigger
language plpgsql
as $$
begin
    new.actualizado_en := now();
    return new;
end;
$$;

drop trigger if exists trg_ejemplo_recurso_actualizado_en
    on public.ejemplo_recurso;

create trigger trg_ejemplo_recurso_actualizado_en
    before update on public.ejemplo_recurso
    for each row execute function public.set_ejemplo_recurso_actualizado_en();


-- =============================================================================
-- 3. RLS y politicas
-- =============================================================================
alter table public.ejemplo_recurso enable row level security;

-- Ejemplo: solo admins leen y modifican. Reemplazar segun el caso.
drop policy if exists "admin lee ejemplo_recurso"   on public.ejemplo_recurso;
drop policy if exists "admin escribe ejemplo_recurso" on public.ejemplo_recurso;

create policy "admin lee ejemplo_recurso"
    on public.ejemplo_recurso for select
    to authenticated
    using (public.es_admin());

create policy "admin escribe ejemplo_recurso"
    on public.ejemplo_recurso for all
    to authenticated
    using (public.es_admin())
    with check (public.es_admin());


-- =============================================================================
-- 4. GRANTs explicitos sobre la tabla
-- =============================================================================
-- IMPORTANTE: desde oct/2026 Supabase deja de otorgar permisos automaticos
-- a tablas nuevas en `public`. Si no se hacen estos GRANTs, supabase-js,
-- PostgREST y GraphQL tiran error 42501 al consultar la tabla.
--
-- Ajustar segun acceso real:
--   - anon          → publico, sin login (suscripciones publicas, etc.).
--   - authenticated → cualquier usuario loggeado (filtrado luego por RLS).
--   - service_role  → siempre todo (lo usan los workers de Edge Functions).

grant select
  on public.ejemplo_recurso
  to anon;

grant select, insert, update, delete
  on public.ejemplo_recurso
  to authenticated;

grant select, insert, update, delete
  on public.ejemplo_recurso
  to service_role;


-- =============================================================================
-- 5. Funciones / RPCs (opcional)
-- =============================================================================
-- create or replace function public.mi_rpc(p_arg text)
-- returns jsonb
-- language plpgsql
-- security definer
-- set search_path = public
-- as $$
-- declare
--     ...
-- begin
--     ...
-- end;
-- $$;
--
-- comment on function public.mi_rpc(text) is 'Que hace y quien la llama.';
--
-- -- Quitar el acceso por defecto al rol "public" (el wide, no nuestro schema):
-- revoke all on function public.mi_rpc(text) from public;
--
-- -- Otorgar solo a los roles que la deben poder ejecutar:
-- grant execute on function public.mi_rpc(text) to authenticated;
-- -- O `to anon` si tiene que ser publica (rate-limit interno).
-- -- O `to service_role` si solo la usan Edge Functions.
