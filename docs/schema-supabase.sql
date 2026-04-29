-- =============================================================================
-- Esquema inicial TM&H en Supabase
-- =============================================================================
-- Copiar y pegar en:  Supabase Dashboard -> SQL Editor -> New query -> Run
--
-- Diseno:
--   - contactos: una fila por persona (email unico).
--   - inscripciones: cada curso/actividad donde participo el contacto.
--   - fuentes: de donde vino cada dato (classroom, wordpress, csv manual...).
--
-- RLS:
--   - Se activa en ambas tablas.
--   - No se crean politicas abiertas. Solo el service_role (admin) puede leer
--     y escribir por ahora. Mas adelante se agregan politicas para alumnos.
-- =============================================================================

-- Extensiones utiles (uuid, citext para email case-insensitive).
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- =============================================================================
-- Tabla: contactos
-- =============================================================================
create table if not exists public.contactos (
    id            uuid primary key default gen_random_uuid(),
    email         citext not null unique,
    nombre        text,
    apellido      text,
    telefono      text,
    notas         text,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

comment on table public.contactos is
    'Directorio unificado de personas vinculadas a TMyH (alumnos, interesados).';
comment on column public.contactos.email is
    'Email normalizado (citext: case-insensitive). Clave natural.';

-- =============================================================================
-- Tabla: inscripciones
-- =============================================================================
create table if not exists public.inscripciones (
    id                 uuid primary key default gen_random_uuid(),
    contacto_id        uuid not null references public.contactos(id) on delete cascade,
    nombre_curso       text not null,
    fuente             text not null,
    -- Ejemplos de fuente: 'classroom:emanuel@gmail.com', 'wordpress:um',
    -- 'csv:2024-simbolia', 'manual'.
    fecha_importacion  timestamptz not null default now(),
    notas              text,
    unique (contacto_id, nombre_curso, fuente)
);

comment on table public.inscripciones is
    'Cada fila: un vinculo contacto-curso con trazabilidad del origen.';

create index if not exists inscripciones_contacto_idx
    on public.inscripciones (contacto_id);
create index if not exists inscripciones_curso_idx
    on public.inscripciones (nombre_curso);

-- =============================================================================
-- Trigger: mantener actualizado_en
-- =============================================================================
create or replace function public.set_actualizado_en()
returns trigger
language plpgsql
as $$
begin
    new.actualizado_en = now();
    return new;
end;
$$;

drop trigger if exists contactos_actualizado_en on public.contactos;
create trigger contactos_actualizado_en
    before update on public.contactos
    for each row execute function public.set_actualizado_en();

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.contactos     enable row level security;
alter table public.inscripciones enable row level security;

-- Sin policies: por defecto, anon y authenticated no ven ni escriben nada.
-- El service_role sigue pudiendo operar desde el Dashboard y scripts admin.

-- =============================================================================
-- Vista util (solo admin via service_role): contactos con sus cursos
-- =============================================================================
create or replace view public.contactos_con_cursos
with (security_invoker = true) as
select
    c.id,
    c.email,
    c.nombre,
    c.apellido,
    c.telefono,
    c.creado_en,
    coalesce(
        (select array_agg(distinct i.nombre_curso order by i.nombre_curso)
         from public.inscripciones i
         where i.contacto_id = c.id),
        '{}'::text[]
    ) as cursos,
    coalesce(
        (select array_agg(distinct i.fuente order by i.fuente)
         from public.inscripciones i
         where i.contacto_id = c.id),
        '{}'::text[]
    ) as fuentes
from public.contactos c;

comment on view public.contactos_con_cursos is
    'Resumen por contacto con arrays de cursos y fuentes. security_invoker = true
    para respetar RLS: solo accede quien pueda ver las tablas subyacentes.';

-- =============================================================================
-- Ejemplos de uso (no se ejecutan, son referencia):
-- =============================================================================
-- insert into public.contactos (email, nombre, apellido, telefono)
-- values ('ana@example.com', 'Ana', 'Perez', '+54 11 1234 5678')
-- on conflict (email) do update set
--     nombre = excluded.nombre,
--     apellido = excluded.apellido,
--     telefono = coalesce(excluded.telefono, public.contactos.telefono);
--
-- insert into public.inscripciones (contacto_id, nombre_curso, fuente)
-- select id, 'Curso de Simbologia', 'wordpress:um'
-- from public.contactos where email = 'ana@example.com'
-- on conflict (contacto_id, nombre_curso, fuente) do nothing;
