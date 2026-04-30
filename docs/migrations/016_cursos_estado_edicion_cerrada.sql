-- =============================================================================
-- Migracion 016: agregar estado publico "edicion_cerrada" para cursos
-- =============================================================================
-- Objetivo:
--   - Permitir un estado explícito para cursos que se muestran en archivo
--     público como "Edición cerrada".
--   - Mantener compatibilidad con estados existentes.
-- =============================================================================

alter table public.cursos
  drop constraint if exists cursos_estado_check;

alter table public.cursos
  add column if not exists eliminado_en timestamptz;

create index if not exists cursos_eliminado_idx
  on public.cursos (eliminado_en)
  where eliminado_en is not null;

alter table public.cursos
  add constraint cursos_estado_check
  check (
    estado in (
      'borrador',
      'activo',
      'inactivo',
      'proximo',
      'historico',
      'edicion_cerrada',
      'archivado'
    )
  );

drop policy if exists cursos_select_public on public.cursos;

create policy cursos_select_public on public.cursos
  for select
  to anon, authenticated
  using (
    (
      eliminado_en is null
      and estado in ('activo', 'proximo', 'historico', 'edicion_cerrada')
    )
    or public.es_admin()
  );

create or replace function public.mover_curso_a_papelera(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'sin_permisos');
    end if;

    update public.cursos
       set eliminado_en = now(),
           estado = case
               when estado in ('activo', 'proximo', 'historico', 'edicion_cerrada') then 'archivado'
               else estado
           end
     where slug = p_slug;

    if not found then
        return jsonb_build_object('ok', false, 'error', 'no_encontrado');
    end if;
    return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.mover_curso_a_papelera(text) from public;
grant execute on function public.mover_curso_a_papelera(text) to authenticated;
