-- =============================================================================
-- Migracion 015: papelera para mensajes de contacto
-- =============================================================================
-- Objetivo:
--   - Agregar soft delete (papelera) a mensajes_contacto.
--   - Permitir restaurar mensajes desde papelera.
--   - Permitir eliminación definitiva solo por admins.
--   - Mantener consistencia en dashboard/bandeja (sin mostrar eliminados).
-- =============================================================================

alter table public.mensajes_contacto
    add column if not exists eliminado_en timestamptz;

comment on column public.mensajes_contacto.eliminado_en is
    'Soft delete de mensajes de contacto. NULL = activo, valor = en papelera.';

create index if not exists mensajes_contacto_eliminado_idx
    on public.mensajes_contacto (eliminado_en)
    where eliminado_en is not null;

-- Para permitir eliminación definitiva desde el panel.
drop policy if exists mensajes_admin_delete on public.mensajes_contacto;
create policy mensajes_admin_delete on public.mensajes_contacto
    for delete using (public.es_admin());

-- Soft delete: mover a papelera
create or replace function public.mover_mensaje_a_papelera(p_mensaje_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'sin_permisos');
    end if;

    update public.mensajes_contacto
       set eliminado_en = now()
     where id = p_mensaje_id
       and eliminado_en is null;

    if not found then
        return jsonb_build_object('ok', false, 'error', 'no_encontrado');
    end if;

    return jsonb_build_object('ok', true);
end;
$$;

-- Restaurar desde papelera
create or replace function public.restaurar_mensaje_desde_papelera(p_mensaje_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'sin_permisos');
    end if;

    update public.mensajes_contacto
       set eliminado_en = null
     where id = p_mensaje_id
       and eliminado_en is not null;

    if not found then
        return jsonb_build_object('ok', false, 'error', 'no_encontrado');
    end if;

    return jsonb_build_object('ok', true);
end;
$$;

-- Purga automática opcional (30 días)
create or replace function public.purgar_mensajes_papelera()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_deleted integer;
begin
    if not public.es_admin() then
        return 0;
    end if;

    delete from public.mensajes_contacto
     where eliminado_en is not null
       and eliminado_en < now() - interval '30 days';

    get diagnostics v_deleted = row_count;
    return v_deleted;
end;
$$;

revoke all on function public.mover_mensaje_a_papelera(uuid) from public;
revoke all on function public.restaurar_mensaje_desde_papelera(uuid) from public;
revoke all on function public.purgar_mensajes_papelera() from public;

grant execute on function public.mover_mensaje_a_papelera(uuid) to authenticated;
grant execute on function public.restaurar_mensaje_desde_papelera(uuid) to authenticated;
grant execute on function public.purgar_mensajes_papelera() to authenticated;

-- Vista resumen (si existe) sin mensajes en papelera
create or replace view public.panel_resumen
with (security_invoker = true) as
select
    (select count(*) from public.mensajes_contacto where eliminado_en is null) as total_mensajes,
    (select count(*) from public.mensajes_contacto where eliminado_en is null and creado_en > now() - interval '7 days') as mensajes_ultima_semana,
    (select count(*) from public.mensajes_contacto where eliminado_en is null and creado_en > now() - interval '30 days') as mensajes_ultimo_mes,
    (select count(*) from public.contactos) as total_contactos,
    (select count(*) from public.contactos where newsletter_optin = true) as suscriptores_newsletter;
