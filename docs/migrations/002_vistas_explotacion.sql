-- =============================================================================
-- Migracion 002: vistas y helpers para explotar inscripciones
-- =============================================================================
-- Objetivo:
--   Mantener la data cruda tal cual vino de Classroom (nombre_curso completo
--   por cada clase), pero armar vistas que extraen 'curso_grupo' y 'clase_num'
--   y permiten consultas limpias sin duplicados.
--
-- Crea:
--   1. Funcion public.extract_clase_num(text) -> int
--   2. Funcion public.extract_curso_grupo(text) -> text
--   3. Vista public.inscripciones_detalle
--        una fila por inscripcion con contacto, grupo y num
--   4. Vista public.contactos_por_curso
--        una fila por contacto-grupo, SIN duplicados, con array de clases
--   5. Vista public.contactos_ficha
--        una fila por contacto con sus grupos y total de clases
--
-- Copiar y pegar en Supabase -> SQL Editor -> Run.
-- Es idempotente: se puede ejecutar varias veces.
-- =============================================================================

-- =============================================================================
-- 1. extract_clase_num: saca el numero de clase del texto del curso.
-- =============================================================================
create or replace function public.extract_clase_num(s text) returns int
language plpgsql
immutable
as $$
declare
    t text;
    m text[];
begin
    t := lower(coalesce(s, ''));

    -- "Clase 12", "clase:12", "clase 2:", "Clase N 5"
    m := regexp_matches(t, 'clase\s*[:\-n]?\s*(\d{1,2})');
    if m is not null then
        return m[1]::int;
    end if;

    -- Cualquier numero aislado de 1 o 2 digitos
    m := regexp_matches(t, '\m(\d{1,2})\M');
    if m is not null and m[1]::int between 1 and 15 then
        return m[1]::int;
    end if;

    -- Ordinales (en espanol). Orden importa: duo/un antes que decima, etc.
    return case
        when t ~ '\mduod[eé]cima\M'  then 12
        when t ~ '\mund[eé]cima\M'   then 11
        when t ~ '\md[eé]cima\M'     then 10
        when t ~ '\mnovena\M'        then 9
        when t ~ '\moctava\M'        then 8
        when t ~ '\ms[eé]ptima\M'    then 7
        when t ~ '\msexta\M'         then 6
        when t ~ '\mquinta\M'        then 5
        when t ~ '\mcuarta\M'        then 4
        when t ~ '\mtercera\M'       then 3
        when t ~ '\msegunda\M'       then 2
        when t ~ '\mprim(era|er)\M'  then 1
        when t ~ '\m[uú]ltima\M'     then 99   -- 99 = "ultima" sin saber cual
        else null
    end;
end $$;

comment on function public.extract_clase_num(text) is
    'Extrae el numero de clase (1..12) del texto del curso. 99 = "ultima".';

-- =============================================================================
-- 2. extract_curso_grupo: agrupa el texto del curso en un nombre limpio.
-- =============================================================================
create or replace function public.extract_curso_grupo(s text) returns text
language sql
immutable
as $$
    select case
        -- El Cuerpo Solar (tiene sus ~12 clases)
        when s ilike '%cuerpo solar%'                              then 'El Cuerpo Solar'

        -- Revelaciones
        when s ilike '%revelaciones%'                              then 'Revelaciones'

        -- Espagiria por nivel (orden: mas especifico primero)
        when s ilike '%espagiria%inicial%'
             or s ilike '%espagiria inicial%'
             or (s ilike '%espagiria%'
                 and (s ilike '%inicial%' or s ilike '%primer grado%'))
                                                                   then 'Espagiria Inicial'
        when s ilike '%espagiria%noviembre%'
             or s ilike '%noviembre%espagiria%'                    then 'Espagiria Noviembre 2021'
        when s ilike '%espagiria%avanzad%'
             or s ilike '%avanzad%espagiria%'
             or s ilike '%espagiria%3er%'
             or s ilike '%espagiria%3°%'
             or s ilike '%espagiria%tercer%'                       then 'Espagiria 3er grado'
        when s ilike '%espagiria%segundo%'
             or s ilike '%espagiria%2do%'
             or s ilike '%espagiria%2°%'
             or s ilike '%espagiria%2 grado%'
             or s ilike '%espagiria%segundo nivel%'                then 'Espagiria 2° grado'
        when s ilike '%espagiria%2021%'                            then 'Espagiria 2021'
        when s ilike '%espagiria%'                                 then 'Espagiria'

        -- Simbologia por anio (orden: mas nuevo primero para matchear bien)
        when s ilike '%simbolog%2024%'                             then 'Simbología 2024'
        when s ilike '%simbolog%2023%'
             or s ilike '%simbolog%septiembre%23%'
             or s ilike '%simbolog%sept%2023%'                     then 'Simbología 2023'
        when s ilike '%simbolog%2022%'
             or s ilike '%simbolog%febrero%2022%'
             or s ilike '%simbolog%junio%2022%'                    then 'Simbología 2022'
        when s ilike '%simbolog%2021%'                             then 'Simbología 2021'
        when s ilike '%simbolog%2020%'                             then 'Simbología 2020'
        when s ilike '%simbolog%'                                  then 'Simbología'

        -- Tradicion hermetica
        when s ilike '%hermetica%' or s ilike '%hermética%'
             or s ilike '%tradici%hermetic%'                       then 'Tradición Hermética'

        -- Fallback
        else 'Otros'
    end;
$$;

comment on function public.extract_curso_grupo(text) is
    'Agrupa el nombre_curso en un nombre de curso "maestro" (sin la N de clase).';

-- =============================================================================
-- 3. Vista: inscripciones_detalle
--    Una fila por inscripcion con datos de contacto y campos derivados.
-- =============================================================================
create or replace view public.inscripciones_detalle
with (security_invoker = true) as
select
    i.id                                 as inscripcion_id,
    c.id                                 as contacto_id,
    c.email,
    c.nombre,
    c.apellido,
    c.telefono,
    public.extract_curso_grupo(i.nombre_curso) as curso_grupo,
    public.extract_clase_num(i.nombre_curso)   as clase_num,
    i.nombre_curso                       as curso_original,
    i.fuente,
    i.fecha_importacion
from public.inscripciones i
join public.contactos c on c.id = i.contacto_id;

comment on view public.inscripciones_detalle is
    'Detalle de todas las inscripciones con contacto + curso_grupo + clase_num derivados.';

-- =============================================================================
-- 4. Vista: contactos_por_curso
--    Una fila por (contacto, curso_grupo): muestra cuantas clases tomo y cuales.
--    Perfecta para "alumnos unicos por curso".
-- =============================================================================
create or replace view public.contactos_por_curso
with (security_invoker = true) as
select
    c.id            as contacto_id,
    c.email,
    c.nombre,
    c.apellido,
    c.telefono,
    public.extract_curso_grupo(i.nombre_curso) as curso_grupo,
    count(distinct public.extract_clase_num(i.nombre_curso))
        filter (where public.extract_clase_num(i.nombre_curso) is not null
                      and public.extract_clase_num(i.nombre_curso) < 90) as clases_tomadas,
    array_agg(distinct public.extract_clase_num(i.nombre_curso)
              order by public.extract_clase_num(i.nombre_curso))
        filter (where public.extract_clase_num(i.nombre_curso) is not null) as numeros_clase,
    array_agg(distinct i.fuente order by i.fuente)                    as fuentes
from public.contactos c
join public.inscripciones i on i.contacto_id = c.id
group by c.id, c.email, c.nombre, c.apellido, c.telefono,
         public.extract_curso_grupo(i.nombre_curso);

comment on view public.contactos_por_curso is
    'Un alumno por curso (unico), con cuantas clases tomo y de que cuentas Classroom viene.';

-- =============================================================================
-- 5. Vista: contactos_ficha
--    Una fila por contacto, con todos sus cursos_grupo agregados.
--    Util para export a newsletter o vista 360 del alumno.
-- =============================================================================
create or replace view public.contactos_ficha
with (security_invoker = true) as
select
    c.id,
    c.email,
    c.nombre,
    c.apellido,
    c.telefono,
    c.creado_en,
    coalesce(
        (select array_agg(distinct public.extract_curso_grupo(i.nombre_curso)
                          order by public.extract_curso_grupo(i.nombre_curso))
         from public.inscripciones i
         where i.contacto_id = c.id),
        '{}'::text[]
    ) as cursos,
    coalesce(
        (select count(distinct i.nombre_curso)
         from public.inscripciones i
         where i.contacto_id = c.id),
        0
    ) as total_clases,
    coalesce(
        (select array_agg(distinct i.fuente order by i.fuente)
         from public.inscripciones i
         where i.contacto_id = c.id),
        '{}'::text[]
    ) as fuentes
from public.contactos c;

comment on view public.contactos_ficha is
    'Ficha de cada contacto: datos personales + array de cursos tomados + total de clases.';
