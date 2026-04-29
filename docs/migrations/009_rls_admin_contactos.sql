-- =============================================================================
-- Migracion 009: RLS de admins para contactos e inscripciones
-- =============================================================================
-- Las tablas `contactos` e `inscripciones` tenian RLS activa sin policies
-- (decision tomada en el schema inicial: solo `service_role` accedia).
-- Eso bloqueaba a los admins logueados via JWT cuando la vista `panel_resumen`
-- queria contar filas: el conteo daba 0 aunque la BD tuviera 1262 contactos.
-- Por eso desde el SQL Editor (service_role) se veian los datos, pero el
-- panel del sitio (JWT del admin) no.
--
-- Esta migracion agrega policies para que el rol `admin` o `super_admin`
-- (definido en `perfiles.rol` y validado por `public.es_admin()`) tenga
-- acceso completo a `contactos` e `inscripciones`. El resto de los roles
-- siguen sin acceso.
--
-- Idempotente. Aplicar en SQL Editor.
-- =============================================================================

-- =============================================================================
-- 1. RLS de contactos
-- =============================================================================
drop policy if exists contactos_admin_select on public.contactos;
create policy contactos_admin_select on public.contactos
    for select using (public.es_admin());

drop policy if exists contactos_admin_update on public.contactos;
create policy contactos_admin_update on public.contactos
    for update using (public.es_admin())
    with check (public.es_admin());

drop policy if exists contactos_admin_insert on public.contactos;
create policy contactos_admin_insert on public.contactos
    for insert with check (public.es_admin());

drop policy if exists contactos_admin_delete on public.contactos;
create policy contactos_admin_delete on public.contactos
    for delete using (public.es_admin());

-- =============================================================================
-- 2. RLS de inscripciones
-- =============================================================================
drop policy if exists inscripciones_admin_select on public.inscripciones;
create policy inscripciones_admin_select on public.inscripciones
    for select using (public.es_admin());

drop policy if exists inscripciones_admin_update on public.inscripciones;
create policy inscripciones_admin_update on public.inscripciones
    for update using (public.es_admin())
    with check (public.es_admin());

drop policy if exists inscripciones_admin_insert on public.inscripciones;
create policy inscripciones_admin_insert on public.inscripciones
    for insert with check (public.es_admin());

drop policy if exists inscripciones_admin_delete on public.inscripciones;
create policy inscripciones_admin_delete on public.inscripciones
    for delete using (public.es_admin());

-- =============================================================================
-- Smoke test (descomentar para validar tras aplicar)
-- =============================================================================
-- select * from public.panel_resumen;
-- -- ahora deberia mostrar total_contactos = 1262, suscriptores_newsletter = 1262.
