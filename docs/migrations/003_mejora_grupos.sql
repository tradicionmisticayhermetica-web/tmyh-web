-- =============================================================================
-- Migracion 003: Mejora en agrupacion de cursos
-- =============================================================================
-- Cambio:
--   extract_curso_grupo pasa a tener 2 argumentos: (nombre_curso, fuente).
--   Usa la fuente (cuenta de Classroom) como senal primaria, y el texto
--   solo como desambiguador dentro de las cuentas mixtas.
--
-- Esto resuelve el problema de que muchas clases se llamaban solo "Clase 7"
-- sin decir de que curso, haciendo imposible agruparlas con texto.
--
-- Como cambia la firma de la funcion, hay que:
--   1. DROPear las vistas que la usan.
--   2. DROPear la funcion vieja (1 arg).
--   3. CREATE la funcion nueva (2 args).
--   4. Recrear las vistas apuntando a la firma nueva.
--
-- Todo idempotente (IF EXISTS / OR REPLACE).
-- =============================================================================

-- 1. Dropear vistas que usan la funcion vieja
drop view if exists public.contactos_ficha;
drop view if exists public.contactos_por_curso;
drop view if exists public.inscripciones_detalle;

-- 2. Dropear la funcion vieja
drop function if exists public.extract_curso_grupo(text);

-- =============================================================================
-- 3. Nueva funcion extract_curso_grupo (nombre_curso, fuente)
-- =============================================================================
create or replace function public.extract_curso_grupo(
    s text,        -- nombre_curso original
    fuente text    -- fuente (cuenta Classroom o wordpress:um)
) returns text
language sql
immutable
as $$
    select case

        -- =====================================================================
        -- CUENTAS DEDICADAS (1 cohorte por cuenta)
        -- =====================================================================
        when fuente in (
            'classroom:cursoespagiria2021@gmail.com',
            'classroom:espagiria2021@gmail.com'
        )                                                     then 'Espagiria 2021'
        when fuente = 'classroom:cursosimbologia2020@gmail.com' then 'Simbología 2020'
        when fuente = 'classroom:cursosimbologia21@gmail.com'   then 'Simbología 2021'
        when fuente = 'classroom:espagirianoviembre21@gmail.com' then 'Espagiria Noviembre 2021'

        -- =====================================================================
        -- cursosimbologia22: Simbología de varios años (2022 / 2023 / 2024)
        -- Default: "Simbología" (sin año) para clases que no explicitan año.
        -- =====================================================================
        when fuente = 'classroom:cursosimbologia22@gmail.com' then
            case
                when s ilike '%2024%'                                   then 'Simbología 2024'
                when s ilike '%2023%'
                     or s ilike '%septiembre%23%'
                     or s ilike '%sept%2023%'                            then 'Simbología 2023'
                when s ilike '%2022%'
                     or s ilike '%febrero%2022%'
                     or s ilike '%junio%2022%'                           then 'Simbología 2022'
                else 'Simbología'
            end

        -- =====================================================================
        -- espagiriasegniv: Espagiria 2° grado + 3er grado
        -- Default: 2° grado (la cuenta se llama "seg niv" = segundo nivel).
        -- =====================================================================
        when fuente = 'classroom:espagiriasegniv@gmail.com' then
            case
                when s ilike '%3er%'
                     or s ilike '%3°%'
                     or s ilike '%3 grado%'
                     or s ilike '%tercer grado%'
                     or s ilike '%tercer%grado%'
                     or s ilike '%avanzad%'                              then 'Espagiria 3er grado'
                when s ilike '%2°%'
                     or s ilike '%2do%'
                     or s ilike '%segundo%'
                     or s ilike '%2 grado%'
                     or s ilike '%segundo nivel%'                        then 'Espagiria 2° grado'
                else 'Espagiria 2° grado'
            end

        -- =====================================================================
        -- Cuenta principal tradicionmisticayhermetica: CuerpoSolar / Revelaciones
        -- / Espagiria Inicial / otros sueltos.
        -- =====================================================================
        when fuente = 'classroom:tradicionmisticayhermetica@gmail.com' then
            case
                when s ilike '%cuerpo solar%'                            then 'El Cuerpo Solar'
                when s ilike '%revelaciones%'                            then 'Revelaciones'
                when s ilike '%espagiria inicial%'
                     or s ilike '%espagiria%inicial%'                    then 'Espagiria Inicial'
                when s ilike '%espagiria%'                               then 'Espagiria Inicial'
                when s ilike '%hermetica%'
                     or s ilike '%hermética%'                            then 'Tradición Hermética'
                else 'Otros'
            end

        -- =====================================================================
        -- WordPress: inscripciones que vengan de UM
        -- =====================================================================
        when fuente ilike 'wordpress:%'                                  then 'WordPress'

        -- Fallback
        else 'Otros'
    end;
$$;

comment on function public.extract_curso_grupo(text, text) is
    'Devuelve el curso "maestro" a partir de (nombre_curso, fuente). '
    'La fuente es el signal primario; el texto solo desambigua dentro de '
    'cuentas mixtas.';

-- =============================================================================
-- 4. Recrear las tres vistas con la firma nueva
-- =============================================================================

-- Vista: inscripciones_detalle
create or replace view public.inscripciones_detalle
with (security_invoker = true) as
select
    i.id                                                   as inscripcion_id,
    c.id                                                   as contacto_id,
    c.email,
    c.nombre,
    c.apellido,
    c.telefono,
    public.extract_curso_grupo(i.nombre_curso, i.fuente)   as curso_grupo,
    public.extract_clase_num(i.nombre_curso)               as clase_num,
    i.nombre_curso                                         as curso_original,
    i.fuente,
    i.fecha_importacion
from public.inscripciones i
join public.contactos c on c.id = i.contacto_id;

comment on view public.inscripciones_detalle is
    'Detalle de inscripciones con curso_grupo y clase_num derivados.';

-- Vista: contactos_por_curso
create or replace view public.contactos_por_curso
with (security_invoker = true) as
select
    c.id            as contacto_id,
    c.email,
    c.nombre,
    c.apellido,
    c.telefono,
    public.extract_curso_grupo(i.nombre_curso, i.fuente) as curso_grupo,
    count(distinct public.extract_clase_num(i.nombre_curso))
        filter (where public.extract_clase_num(i.nombre_curso) is not null
                      and public.extract_clase_num(i.nombre_curso) < 90) as clases_tomadas,
    array_agg(distinct public.extract_clase_num(i.nombre_curso)
              order by public.extract_clase_num(i.nombre_curso))
        filter (where public.extract_clase_num(i.nombre_curso) is not null) as numeros_clase,
    array_agg(distinct i.fuente order by i.fuente)                          as fuentes
from public.contactos c
join public.inscripciones i on i.contacto_id = c.id
group by c.id, c.email, c.nombre, c.apellido, c.telefono,
         public.extract_curso_grupo(i.nombre_curso, i.fuente);

comment on view public.contactos_por_curso is
    'Un alumno por curso (unico), con cuantas clases tomo y de que cuentas viene.';

-- Vista: contactos_ficha
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
        (select array_agg(distinct public.extract_curso_grupo(i.nombre_curso, i.fuente)
                          order by public.extract_curso_grupo(i.nombre_curso, i.fuente))
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
    'Ficha por contacto con array de cursos_grupo tomados y total de clases.';
