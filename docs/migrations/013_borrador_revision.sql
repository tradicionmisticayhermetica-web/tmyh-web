-- =============================================================================
-- Migracion 013: borrador de revision
-- =============================================================================
-- Permite que el admin edite un post publicado sin afectar lo que ven los
-- visitantes hasta que decida publicar la revision.
--
-- Flujo:
--   - "Guardar cambios" → escribe en borrador_json / borrador_html / borrador_*
--     El post publicado (contenido_json, contenido_html, etc.) NO se modifica.
--     El visitante sigue viendo la version publicada anterior.
--
--   - "Publicar revision" → copia borrador_* a contenido_*, titulo, extracto,
--     etiquetas, slug. Dispara el deploy del sitio. Borra el borrador (ya
--     no hace falta guardarlo).
--
--   - "Descartar borrador" → borra borrador_* sin tocar la version publicada.
--
-- Para posts en estado "borrador" (aun no publicados) el comportamiento es el
-- mismo de antes: Guardar guarda el post y Publicar lo pone publico.
-- =============================================================================

alter table public.posts
    add column if not exists borrador_titulo      text,
    add column if not exists borrador_extracto    text,
    add column if not exists borrador_json        jsonb,
    add column if not exists borrador_html        text,
    add column if not exists borrador_etiquetas   text[],
    add column if not exists borrador_slug        text,
    add column if not exists borrador_modificado_en timestamptz;

comment on column public.posts.borrador_titulo is
    'Titulo en edicion. NULL = sin cambios pendientes.';
comment on column public.posts.borrador_json is
    'Contenido del editor en edicion. No se muestra al publico hasta publicar.';
comment on column public.posts.borrador_html is
    'HTML renderizado del borrador.';
comment on column public.posts.borrador_modificado_en is
    'Cuando se guardo por ultima vez el borrador.';

-- RPC: guardar borrador (nunca toca el contenido publicado)
create or replace function public.guardar_borrador_post(
    p_post_id         uuid,
    p_titulo          text,
    p_extracto        text,
    p_slug            text,
    p_contenido_json  jsonb,
    p_contenido_html  text,
    p_etiquetas       text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'sin_permisos');
    end if;

    perform 1 from public.posts where id = p_post_id and eliminado_en is null;
    if not found then
        return jsonb_build_object('ok', false, 'error', 'no_encontrado');
    end if;

    update public.posts
       set borrador_titulo       = p_titulo,
           borrador_extracto     = p_extracto,
           borrador_slug         = p_slug,
           borrador_json         = p_contenido_json,
           borrador_html         = p_contenido_html,
           borrador_etiquetas    = p_etiquetas,
           borrador_modificado_en = now()
     where id = p_post_id;

    return jsonb_build_object('ok', true);
end;
$$;

-- RPC: publicar revision (copia borrador -> publicado y limpia el borrador)
create or replace function public.publicar_revision_post(
    p_post_id         uuid,
    p_titulo          text,
    p_extracto        text,
    p_slug            text,
    p_contenido_json  jsonb,
    p_contenido_html  text,
    p_etiquetas       text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'sin_permisos');
    end if;

    perform 1 from public.posts where id = p_post_id and eliminado_en is null;
    if not found then
        return jsonb_build_object('ok', false, 'error', 'no_encontrado');
    end if;

    update public.posts
       set titulo               = p_titulo,
           extracto             = p_extracto,
           slug                 = p_slug,
           contenido_json       = p_contenido_json,
           contenido_html       = p_contenido_html,
           etiquetas            = p_etiquetas,
           estado               = 'publicado',
           publicado_en         = coalesce(publicado_en, now()),
           -- Limpiar el borrador
           borrador_titulo      = null,
           borrador_extracto    = null,
           borrador_slug        = null,
           borrador_json        = null,
           borrador_html        = null,
           borrador_etiquetas   = null,
           borrador_modificado_en = null
     where id = p_post_id;

    return jsonb_build_object('ok', true);
end;
$$;

-- RPC: descartar borrador sin tocar el publicado
create or replace function public.descartar_borrador_post(p_post_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'sin_permisos');
    end if;

    update public.posts
       set borrador_titulo      = null,
           borrador_extracto    = null,
           borrador_slug        = null,
           borrador_json        = null,
           borrador_html        = null,
           borrador_etiquetas   = null,
           borrador_modificado_en = null
     where id = p_post_id;

    return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.guardar_borrador_post(uuid,text,text,text,jsonb,text,text[]) from public;
revoke all on function public.publicar_revision_post(uuid,text,text,text,jsonb,text,text[]) from public;
revoke all on function public.descartar_borrador_post(uuid) from public;
grant execute on function public.guardar_borrador_post(uuid,text,text,text,jsonb,text,text[]) to authenticated;
grant execute on function public.publicar_revision_post(uuid,text,text,text,jsonb,text,text[]) to authenticated;
grant execute on function public.descartar_borrador_post(uuid) to authenticated;
