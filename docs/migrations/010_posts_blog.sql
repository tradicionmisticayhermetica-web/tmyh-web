-- =============================================================================
-- Migracion 010: tabla posts (blog)
-- =============================================================================
-- Crea la tabla `public.posts` donde se guardan los articulos del blog que
-- Emanuel crea desde el backoffice en /area-reservada/blog/.
--
-- El contenido se guarda en dos formatos:
--   - contenido_json: el JSON nativo de Tiptap/ProseMirror, para volver
--     a cargar el editor con el contenido intacto.
--   - contenido_html: el HTML renderizado, lo que se muestra al visitante.
--
-- RLS:
--   - SELECT publico para posts con estado = 'publicado'.
--   - INSERT / UPDATE / DELETE solo para admins (es_admin()).
--
-- Auto-deploy:
--   Al hacer INSERT o UPDATE en esta tabla con estado = 'publicado', un
--   Database Webhook dispara la edge function `trigger-build` que lanza
--   un GitHub Actions workflow. El workflow buildea el sitio y pushea a
--   la rama `production`. Ferozo lo baja con git pull (cron cada 10 min).
--
-- Idempotente. Aplicar en SQL Editor.
-- =============================================================================

-- =============================================================================
-- 1. Tabla posts
-- =============================================================================
create table if not exists public.posts (
    id                  uuid primary key default gen_random_uuid(),
    slug                text not null unique,
    titulo              text not null,
    extracto            text,
    contenido_json      jsonb,
    contenido_html      text,
    imagen_destacada    text,
    autor_id            uuid references public.perfiles(id) on delete set null,
    estado              text not null default 'borrador'
                        check (estado in ('borrador', 'publicado', 'archivado')),
    etiquetas           text[] not null default '{}',
    publicado_en        timestamptz,
    creado_en           timestamptz not null default now(),
    actualizado_en      timestamptz not null default now()
);

comment on table public.posts is
    'Articulos del blog. El contenido se almacena en JSON (editor Tiptap)
    y en HTML renderizado (para servir al visitante).';

comment on column public.posts.slug is
    'URL slug unico. Ej: "el-simbolo-como-llave-del-alma".';

comment on column public.posts.contenido_json is
    'Representacion interna de Tiptap/ProseMirror. Se carga de vuelta en el
    editor para poder editar el post.';

comment on column public.posts.contenido_html is
    'HTML listo para mostrar al visitante. Se genera al guardar/publicar.';

comment on column public.posts.imagen_destacada is
    'URL publica de la imagen destacada en Supabase Storage
    (bucket blog-images).';

comment on column public.posts.estado is
    'borrador: no visible al publico.
    publicado: visible en /blog y apto para newsletter.
    archivado: oculto al publico pero conservado en la BD.';

-- =============================================================================
-- 2. Trigger: actualizar actualizado_en
-- =============================================================================
-- Reutiliza la funcion set_actualizado_en() creada en schema-supabase.sql.
-- Si no existe aun, la crea.
create or replace function public.set_actualizado_en()
returns trigger
language plpgsql
as $$
begin
    new.actualizado_en = now();
    return new;
end;
$$;

drop trigger if exists posts_actualizado_en on public.posts;
create trigger posts_actualizado_en
    before update on public.posts
    for each row execute function public.set_actualizado_en();

-- =============================================================================
-- 3. Trigger: setear publicado_en cuando pasa a publicado
-- =============================================================================
create or replace function public.handle_post_publicado()
returns trigger
language plpgsql
as $$
begin
    -- Solo setea publicado_en la primera vez que se publica.
    if new.estado = 'publicado' and (old.estado is null or old.estado <> 'publicado') then
        if new.publicado_en is null then
            new.publicado_en := now();
        end if;
    end if;
    return new;
end;
$$;

drop trigger if exists posts_handle_publicado on public.posts;
create trigger posts_handle_publicado
    before insert or update on public.posts
    for each row execute function public.handle_post_publicado();

-- =============================================================================
-- 4. Indice para el listado publico (/blog)
-- =============================================================================
create index if not exists posts_estado_publicado_idx
    on public.posts (publicado_en desc)
    where estado = 'publicado';

create index if not exists posts_slug_idx
    on public.posts (slug);

create index if not exists posts_etiquetas_gin
    on public.posts using gin (etiquetas);

-- =============================================================================
-- 5. RLS
-- =============================================================================
alter table public.posts enable row level security;

-- Lectura publica: solo posts publicados
drop policy if exists posts_public_select on public.posts;
create policy posts_public_select on public.posts
    for select using (
        estado = 'publicado'
        or public.es_admin()
    );

-- Solo admins crean, editan, archivan
drop policy if exists posts_admin_insert on public.posts;
create policy posts_admin_insert on public.posts
    for insert with check (public.es_admin());

drop policy if exists posts_admin_update on public.posts;
create policy posts_admin_update on public.posts
    for update using (public.es_admin())
    with check (public.es_admin());

drop policy if exists posts_admin_delete on public.posts;
create policy posts_admin_delete on public.posts
    for delete using (public.es_admin());

-- =============================================================================
-- Smoke tests (descomentar para validar)
-- =============================================================================
-- select * from public.posts order by creado_en desc limit 5;
-- select public.es_admin();
