-- =============================================================================
-- Migracion 019: es_admin() reconoce service_role
-- =============================================================================
-- Las edge functions y cron jobs invocan RPCs con el JWT de service_role.
-- La funcion `public.es_admin()` original solo miraba `perfiles` via auth.uid(),
-- y como service_role no tiene perfil, devolvia false → toda RPC protegida
-- (newsletter_proximo_lote, marcar_enviado, etc.) le respondia 'no_autorizado'.
--
-- Esta migracion agrega un OR previo: si auth.role() = 'service_role', es admin.
-- Patron estandar de Supabase para que workers backend puedan operar.
--
-- Idempotente. No toca otras funciones ni policies.
-- =============================================================================

create or replace function public.es_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select
      -- Cualquier llamada con JWT de service_role (worker, cron, edge function
      -- usando SUPABASE_SERVICE_ROLE_KEY) cuenta como admin.
      auth.role() = 'service_role'
      or exists (
          select 1 from public.perfiles
           where id = auth.uid()
             and activo = true
             and rol in ('admin', 'super_admin')
      );
$$;

-- Permisos sin cambios (anon, authenticated, service_role implicito).
revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to anon, authenticated, service_role;
