-- =============================================================================
-- Migracion 014: backoffice de cursos (CMS)
-- =============================================================================
-- Objetivo:
--   - Permitir crear/editar cursos desde /area-reservada/cursos.
--   - Mantener compatibilidad con el sitio público (cards + detalle por slug).
--   - Exponer solo cursos "publicables" al rol anon.
--
-- Notas:
--   - La tabla vive en public y tiene RLS activo.
--   - Admins (public.es_admin()) pueden CRUD completo.
--   - Visitantes anon/authenticated solo leen estados públicos.
-- =============================================================================

create table if not exists public.cursos (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    titulo text not null,
    subtitulo text,
    descripcion_corta text not null,
    descripcion_larga text[] not null default '{}'::text[],
    clases integer not null default 1 check (clases >= 1),
    modalidad text not null default 'Grabado'
        check (modalidad in ('Online en vivo', 'Grabado', 'Híbrido')),
    nivel text not null default 'Inicial',
    temas jsonb not null default '[]'::jsonb,
    inicio text,
    duracion text,
    estado text not null default 'borrador'
        check (estado in ('borrador', 'activo', 'inactivo', 'proximo', 'historico', 'archivado')),
    simbolo text not null default '✦',

    -- Precio
    precio_arg_efectivo text,
    precio_arg_transferencia text,
    precio_internacional_usd text,
    precio_nota text,

    -- Datos de inscripción / cobro
    inscripcion_email text,
    inscripcion_whatsapp text,
    inscripcion_link_mercadopago text,
    inscripcion_paypal_user text,
    inscripcion_cbu text,
    inscripcion_alias text,
    inscripcion_banco text,
    inscripcion_cuit text,

    -- Metadatos
    anio_original text,
    imagen text,
    imagen_alt text,
    programa_pdf text,
    orden integer not null default 100,
    publicado_en timestamptz,
    eliminado_en timestamptz,
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),

    constraint cursos_temas_es_array
        check (jsonb_typeof(temas) = 'array')
);

comment on table public.cursos is
    'Catalogo de cursos editable desde el backoffice.';
comment on column public.cursos.temas is
    'Array JSON de temario. Cada item puede ser string o {titulo, items[]}.';
comment on column public.cursos.estado is
    'Estados de gestion y publicación del curso.';

create index if not exists cursos_estado_idx
    on public.cursos (estado);

create index if not exists cursos_orden_idx
    on public.cursos (orden, titulo);

create index if not exists cursos_actualizado_idx
    on public.cursos (actualizado_en desc);

create index if not exists cursos_eliminado_idx
    on public.cursos (eliminado_en)
    where eliminado_en is not null;

create or replace function public.set_cursos_actualizado_en()
returns trigger
language plpgsql
as $$
begin
    new.actualizado_en := now();
    return new;
end;
$$;

drop trigger if exists trg_cursos_actualizado_en on public.cursos;
create trigger trg_cursos_actualizado_en
before update on public.cursos
for each row execute function public.set_cursos_actualizado_en();

alter table public.cursos enable row level security;

-- Limpieza defensiva por si se reaplica.
drop policy if exists cursos_select_public on public.cursos;
drop policy if exists cursos_insert_admin on public.cursos;
drop policy if exists cursos_update_admin on public.cursos;
drop policy if exists cursos_delete_admin on public.cursos;

-- Lectura pública solo para estados visibles en el sitio.
create policy cursos_select_public on public.cursos
    for select
    to anon, authenticated
    using (
        (eliminado_en is null and estado in ('activo', 'proximo', 'historico'))
        or public.es_admin()
    );

-- Escritura solo admins autenticados.
create policy cursos_insert_admin on public.cursos
    for insert
    to authenticated
    with check (public.es_admin());

create policy cursos_update_admin on public.cursos
    for update
    to authenticated
    using (public.es_admin())
    with check (public.es_admin());

create policy cursos_delete_admin on public.cursos
    for delete
    to authenticated
    using (public.es_admin());

-- =============================================================================
-- RPCs de papelera (30 días)
-- =============================================================================
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
               when estado in ('activo', 'proximo', 'historico') then 'archivado'
               else estado
           end
     where slug = p_slug;

    if not found then
        return jsonb_build_object('ok', false, 'error', 'no_encontrado');
    end if;
    return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.restaurar_curso_desde_papelera(p_slug text)
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
       set eliminado_en = null,
           estado = case
               when estado in ('archivado', 'inactivo', 'borrador') then 'inactivo'
               else estado
           end
     where slug = p_slug;

    if not found then
        return jsonb_build_object('ok', false, 'error', 'no_encontrado');
    end if;
    return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.purgar_cursos_papelera()
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

    delete from public.cursos
     where eliminado_en is not null
       and eliminado_en < now() - interval '30 days';
    get diagnostics v_deleted = row_count;
    return v_deleted;
end;
$$;

revoke all on function public.mover_curso_a_papelera(text) from public;
revoke all on function public.restaurar_curso_desde_papelera(text) from public;
revoke all on function public.purgar_cursos_papelera() from public;
grant execute on function public.mover_curso_a_papelera(text) to authenticated;
grant execute on function public.restaurar_curso_desde_papelera(text) to authenticated;
grant execute on function public.purgar_cursos_papelera() to authenticated;
