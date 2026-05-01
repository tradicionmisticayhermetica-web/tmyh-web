-- =============================================================================
-- Migracion 018: cron + helpers del worker de newsletter
-- =============================================================================
-- Conecta la cola creada en 017 con un schedule automático que procesa los
-- envíos pendientes cada hora. La función real de envío es la edge function
-- `procesar-newsletter-cola` (en supabase/functions). Acá solo:
--
--   1) Helpers SQL:
--        - newsletter_envios_hoy()              cuenta enviados del día (UTC-3).
--        - newsletter_rescatar_envios_trabados() devuelve a 'pendiente' filas
--          que llevan más de N minutos en 'enviando' (worker caído).
--
--   2) Schedule cron job que invoca la edge function cada hora vía pg_net.
--      Requiere extensiones `pg_cron` y `pg_net` (ya disponibles en Supabase).
--
-- =============================================================================
-- ⚠️ ANTES DE APLICAR ESTA MIGRACIÓN
-- =============================================================================
-- Reemplazar los DOS placeholders de abajo por los valores reales del proyecto
-- ANTES de correr el script en el SQL Editor:
--
--   __FUNCTIONS_URL__   →   https://<reference-id>.supabase.co/functions/v1
--                           (Settings → API → Project URL + "/functions/v1")
--
--   __SERVICE_ROLE__    →   eyJhbG...  (JWT entero del service_role)
--                           (Settings → API → Legacy keys → service_role)
--
-- El JWT queda guardado en `cron.job.command` (sólo lo ven el rol postgres y
-- service_role, que ya tienen acceso completo a la base — no agrega riesgo).
--
-- Idempotente. Aplicar en SQL Editor.
-- =============================================================================

-- =============================================================================
-- 1) Extensiones necesarias
-- =============================================================================
-- pg_cron y pg_net suelen estar pre-habilitadas en Supabase, pero el `IF NOT
-- EXISTS` las activa si todavía no estaban en este schema.
create extension if not exists pg_cron;
create extension if not exists pg_net;


-- =============================================================================
-- 2) Helper: contar envíos del día corriente (UTC-3)
-- =============================================================================
-- Usado por la edge function para no superar el cupo diario de Resend Free.
create or replace function public.newsletter_envios_hoy()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
    v_inicio timestamptz;
    v_total  int;
begin
    -- "Inicio del día" en hora Argentina, expresado en timestamptz absoluto.
    v_inicio := date_trunc('day', (now() at time zone 'America/Argentina/Buenos_Aires'))
                at time zone 'America/Argentina/Buenos_Aires';

    select count(*) into v_total
      from public.newsletter_envios
     where estado = 'enviado'
       and enviado_en >= v_inicio;

    return coalesce(v_total, 0);
end;
$$;

revoke all on function public.newsletter_envios_hoy() from public;
grant execute on function public.newsletter_envios_hoy() to authenticated, service_role;

comment on function public.newsletter_envios_hoy is
    'Cantidad de envíos en estado "enviado" desde el inicio del día corriente (zona Argentina). Usado para respetar el cupo diario de Resend.';


-- =============================================================================
-- 3) Helper: rescatar envíos trabados
-- =============================================================================
-- Si un worker se cae mientras procesa un lote, las filas reservadas quedan
-- en 'enviando' indefinidamente. Esta función las devuelve a 'pendiente'
-- para que un próximo tick las pueda volver a tomar.
--
-- Por defecto: filas en 'enviando' por más de 15 minutos.
create or replace function public.newsletter_rescatar_envios_trabados(
    p_minutos int default 15
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
    v_rescatados int;
begin
    update public.newsletter_envios
       set estado       = 'pendiente',
           reservado_en = null
     where estado = 'enviando'
       and reservado_en is not null
       and reservado_en < now() - make_interval(mins => greatest(p_minutos, 1));

    get diagnostics v_rescatados = row_count;
    return v_rescatados;
end;
$$;

revoke all on function public.newsletter_rescatar_envios_trabados(int) from public;
grant execute on function public.newsletter_rescatar_envios_trabados(int)
    to authenticated, service_role;

comment on function public.newsletter_rescatar_envios_trabados is
    'Devuelve a "pendiente" envíos en "enviando" desde hace más de N minutos. Defensa contra workers que mueren mid-tick.';


-- =============================================================================
-- 4) Cron job: invocar la edge function cada hora
-- =============================================================================
-- pg_cron permite programar SQL arbitrario; usamos pg_net.http_post para
-- invocar la edge function. La auth pasa por el header Authorization con el
-- service_role JWT (esa función exige admin o service_role).
--
-- Si el job ya existe, lo reemplazamos (idempotente).
do $$
declare
    v_jobid bigint;
begin
    -- Eliminar job previo si existía (idempotente).
    select jobid into v_jobid
      from cron.job
     where jobname = 'newsletter-procesar-cola';
    if v_jobid is not null then
        perform cron.unschedule(v_jobid);
    end if;

    -- Programar cada hora en el minuto 5 (margen para que workers anteriores
    -- terminen y no haya solapamientos al cambio de hora).
    perform cron.schedule(
        'newsletter-procesar-cola',
        '5 * * * *',
        $cron$
        select net.http_post(
            url := '__FUNCTIONS_URL__/procesar-newsletter-cola',
            headers := jsonb_build_object(
                'Authorization', 'Bearer __SERVICE_ROLE__',
                'Content-Type', 'application/json'
            ),
            body := '{}'::jsonb,
            timeout_milliseconds := 60000
        );
        $cron$
    );

    raise notice 'Cron job "newsletter-procesar-cola" programado: 5 * * * * -> __FUNCTIONS_URL__/procesar-newsletter-cola';
end $$;


-- =============================================================================
-- 5) Verificación (queries útiles)
-- =============================================================================
-- Para inspeccionar lo programado:
--
--   select jobid, jobname, schedule, command from cron.job
--    where jobname = 'newsletter-procesar-cola';
--
--   select jobid, runid, status, return_message, start_time, end_time
--     from cron.job_run_details
--    where jobid = (select jobid from cron.job where jobname = 'newsletter-procesar-cola')
--    order by start_time desc limit 10;
