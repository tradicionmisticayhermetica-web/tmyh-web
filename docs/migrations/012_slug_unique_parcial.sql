-- =============================================================================
-- Migracion 012: slug unique parcial (excluye posts en papelera)
-- =============================================================================
-- La restriccion UNIQUE original en posts.slug aplica a todas las filas,
-- incluyendo posts en la papelera (eliminado_en IS NOT NULL). Eso hace que
-- si mandas un post a la papelera no puedas crear uno nuevo con el mismo slug
-- hasta eliminarlo definitivamente.
--
-- Fix: reemplazar la restriccion unica por un INDICE UNICO PARCIAL que solo
-- aplica a posts activos (eliminado_en IS NULL). Asi la papelera no bloquea
-- la reutilizacion de slugs.
--
-- Idempotente. Aplicar en SQL Editor.
-- =============================================================================

-- 1. Eliminar la restriccion unica original
alter table public.posts
    drop constraint if exists posts_slug_key;

-- 2. Crear indice unico parcial: solo entre posts no eliminados
drop index if exists public.posts_slug_active_uidx;
create unique index posts_slug_active_uidx
    on public.posts (slug)
    where eliminado_en is null;

comment on index public.posts_slug_active_uidx is
    'Unicidad de slug solo para posts activos. Los posts en papelera (eliminado_en NOT NULL)
    no bloquean la creacion de nuevos posts con el mismo slug.';

-- Smoke test:
-- insert into public.posts (slug, titulo, estado, eliminado_en)
-- values (''test'', ''Test 1'', ''borrador'', now()); -- va a papelera
-- insert into public.posts (slug, titulo, estado)
-- values (''test'', ''Test 2'', ''borrador''); -- debe funcionar
