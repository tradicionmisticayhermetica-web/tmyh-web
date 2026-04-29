-- =============================================================================
-- Migracion 007: capturar respuestas entrantes del visitante (Resend Inbound)
-- =============================================================================
-- Objetivo:
--   Cuando un visitante responde un mail, queremos que esa respuesta caiga en
--   el mismo thread del panel (no solo en Gmail). Para eso, Resend Inbound
--   recibe el mail en un subdominio (`inbox.tradicionmistica...com`) y nos
--   manda un webhook a una Edge Function (`recibir-respuesta`) que inserta
--   la fila en `respuestas_mensaje`.
--
-- Cambios:
--   1. Columnas nuevas en `respuestas_mensaje`:
--        - es_del_visitante boolean default false
--        - resend_outbound_id text  (id que devuelve Resend cuando enviamos
--          el mail original; usado luego para matchear el In-Reply-To)
--        - resend_inbound_id text   (id del mail entrante segun Resend; sirve
--          para deduplicacion si el webhook se repite)
--   2. Recreamos la vista `mensajes_con_thread` (drop+create) para que
--      seleccione tambien `es_del_visitante` y `resend_outbound_id`.
--   3. RPC `registrar_respuesta_visitante(...)`: usado por la edge function
--      `recibir-respuesta`. La edge function corre con service_role key, asi
--      que no necesita bypassear RLS. Igualmente la dejamos `security definer`
--      para mantener la simetria con la otra RPC.
--   4. Update del RPC `registrar_respuesta_mensaje(...)` para aceptar un
--      parametro opcional `p_resend_id` que guarde el id de Resend cuando se
--      envia el mail saliente (asi luego matcheamos con In-Reply-To).
--
-- Idempotente. Aplicar una sola vez en SQL Editor.
-- =============================================================================

-- =============================================================================
-- 1. Columnas nuevas en respuestas_mensaje
-- =============================================================================
alter table public.respuestas_mensaje
    add column if not exists es_del_visitante boolean not null default false;

alter table public.respuestas_mensaje
    add column if not exists resend_outbound_id text;

alter table public.respuestas_mensaje
    add column if not exists resend_inbound_id text;

-- Indice para deduplicacion del webhook (si Resend re-entrega, no insertamos dos veces)
create unique index if not exists respuestas_mensaje_resend_inbound_uidx
    on public.respuestas_mensaje (resend_inbound_id)
    where resend_inbound_id is not null;

-- Indice para matcheo rapido por outbound_id cuando llega un In-Reply-To
create index if not exists respuestas_mensaje_resend_outbound_idx
    on public.respuestas_mensaje (resend_outbound_id)
    where resend_outbound_id is not null;

-- Tambien permitimos que `respondido_por` sea NULL para mensajes del visitante
-- (la columna ya permite NULL, no hace falta cambiarla)

-- =============================================================================
-- 2. Recrear vista mensajes_con_thread
-- =============================================================================
drop view if exists public.mensajes_con_thread;
create view public.mensajes_con_thread
with (security_invoker = true) as
select
    m.*,
    coalesce(t.total_respuestas, 0)::int as total_respuestas,
    coalesce(t.respuestas_admin, 0)::int as respuestas_admin,
    coalesce(t.respuestas_visitante, 0)::int as respuestas_visitante,
    t.ultima_respuesta_en
from public.mensajes_contacto m
left join (
    select
        mensaje_id,
        count(*) as total_respuestas,
        count(*) filter (where es_del_visitante = false) as respuestas_admin,
        count(*) filter (where es_del_visitante = true)  as respuestas_visitante,
        max(enviado_en) as ultima_respuesta_en
      from public.respuestas_mensaje
     group by mensaje_id
) t on t.mensaje_id = m.id;

comment on view public.mensajes_con_thread is
    'Mensajes + total_respuestas, respuestas_admin, respuestas_visitante, ultima_respuesta_en. Solo visible para admins.';

-- =============================================================================
-- 3. Reemplazo de registrar_respuesta_mensaje (acepta resend_outbound_id)
-- =============================================================================
-- Drop primero porque cambia la firma (suma un parametro)
drop function if exists public.registrar_respuesta_mensaje(uuid, text, text);

create or replace function public.registrar_respuesta_mensaje(
    p_mensaje_id uuid,
    p_asunto     text,
    p_cuerpo     text,
    p_resend_id  text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid    uuid;
    v_email  text;
    v_resp   uuid;
    v_total  int;
begin
    v_uid := auth.uid();

    if v_uid is null then
        return jsonb_build_object('ok', false, 'error', 'no_autenticado');
    end if;

    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'sin_permisos');
    end if;

    if p_asunto is null or length(trim(p_asunto)) < 2 then
        return jsonb_build_object('ok', false, 'error', 'asunto_invalido');
    end if;

    if p_cuerpo is null or length(trim(p_cuerpo)) < 5 then
        return jsonb_build_object('ok', false, 'error', 'cuerpo_invalido');
    end if;

    select email::text into v_email
      from public.perfiles
     where id = v_uid;

    perform 1 from public.mensajes_contacto where id = p_mensaje_id;
    if not found then
        return jsonb_build_object('ok', false, 'error', 'mensaje_no_encontrado');
    end if;

    insert into public.respuestas_mensaje (
        mensaje_id, respondido_por, respondido_por_email,
        asunto, cuerpo, es_del_visitante, resend_outbound_id
    ) values (
        p_mensaje_id, v_uid, coalesce(v_email, ''),
        trim(p_asunto), p_cuerpo, false, p_resend_id
    )
    returning id into v_resp;

    update public.mensajes_contacto
       set respondido       = true,
           respondido_en    = coalesce(respondido_en, now()),
           respondido_por   = coalesce(respondido_por, v_uid),
           respuesta_asunto = trim(p_asunto),
           respuesta_cuerpo = p_cuerpo
     where id = p_mensaje_id;

    select count(*)::int into v_total
      from public.respuestas_mensaje
     where mensaje_id = p_mensaje_id;

    return jsonb_build_object(
        'ok', true,
        'respuesta_id', v_resp,
        'numero_respuesta', v_total
    );
exception
    when others then
        return jsonb_build_object(
            'ok', false,
            'error', 'error_interno',
            'error_detalle', sqlerrm,
            'error_state', sqlstate
        );
end;
$$;

revoke all on function public.registrar_respuesta_mensaje(uuid, text, text, text) from public;
grant execute on function public.registrar_respuesta_mensaje(uuid, text, text, text) to authenticated;

comment on function public.registrar_respuesta_mensaje is
    'Inserta una respuesta del admin en el thread (con resend_id opcional para matchear inbound posteriores). Solo admins.';

-- =============================================================================
-- 4. RPC nuevo: registrar_respuesta_visitante
-- =============================================================================
-- Llamada por la edge function `recibir-respuesta` con service_role key
-- (security definer + search_path).
-- Hace lookup del mensaje origen via:
--   a) resend_outbound_id (si nos pasaron uno desde el header In-Reply-To)
--   b) o por email del visitante (fallback: ultimo mensaje pendiente o mas
--      reciente de ese email)
-- Devuelve {ok, mensaje_id, respuesta_id} o {ok:false, error}.
create or replace function public.registrar_respuesta_visitante(
    p_email_visitante  text,
    p_asunto           text,
    p_cuerpo           text,
    p_resend_inbound_id text,
    p_in_reply_to       text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_mensaje_id uuid;
    v_respuesta_id uuid;
    v_total int;
begin
    if p_email_visitante is null or length(trim(p_email_visitante)) < 3 then
        return jsonb_build_object('ok', false, 'error', 'email_invalido');
    end if;

    if p_resend_inbound_id is null then
        return jsonb_build_object('ok', false, 'error', 'inbound_id_faltante');
    end if;

    -- Idempotencia: si ya existe una fila con este resend_inbound_id, devolvemos ok
    select mensaje_id into v_mensaje_id
      from public.respuestas_mensaje
     where resend_inbound_id = p_resend_inbound_id
     limit 1;

    if v_mensaje_id is not null then
        return jsonb_build_object(
            'ok', true,
            'mensaje_id', v_mensaje_id,
            'duplicado', true
        );
    end if;

    -- 1. Match por In-Reply-To: extraemos el outbound_id del header
    -- El In-Reply-To suele venir como "<resend-message-id@us-east-1.amazonses.com>"
    -- pero lo que nos importa es el match exacto contra resend_outbound_id.
    if p_in_reply_to is not null and length(trim(p_in_reply_to)) > 0 then
        -- Limpiamos < y >
        select mensaje_id into v_mensaje_id
          from public.respuestas_mensaje
         where resend_outbound_id is not null
           and (
               position(resend_outbound_id in p_in_reply_to) > 0
               or p_in_reply_to like '%' || resend_outbound_id || '%'
           )
         order by enviado_en desc
         limit 1;
    end if;

    -- 2. Fallback: matchear por email del visitante (mensaje mas reciente de ese email)
    if v_mensaje_id is null then
        select id into v_mensaje_id
          from public.mensajes_contacto
         where lower(email::text) = lower(trim(p_email_visitante))
         order by creado_en desc
         limit 1;
    end if;

    if v_mensaje_id is null then
        return jsonb_build_object(
            'ok', false,
            'error', 'mensaje_origen_no_encontrado',
            'email', p_email_visitante
        );
    end if;

    -- Insertar la respuesta del visitante
    insert into public.respuestas_mensaje (
        mensaje_id, respondido_por, respondido_por_email,
        asunto, cuerpo, es_del_visitante, resend_inbound_id
    ) values (
        v_mensaje_id, null, lower(trim(p_email_visitante)),
        coalesce(trim(p_asunto), '(sin asunto)'),
        coalesce(p_cuerpo, '(cuerpo vacio)'),
        true, p_resend_inbound_id
    )
    returning id into v_respuesta_id;

    -- Reabrir el mensaje como pendiente para que aparezca en la bandeja:
    -- la respuesta del visitante implica que hay algo nuevo para responder.
    update public.mensajes_contacto
       set respondido = false,
           respondido_en = null
     where id = v_mensaje_id;

    select count(*)::int into v_total
      from public.respuestas_mensaje
     where mensaje_id = v_mensaje_id;

    return jsonb_build_object(
        'ok', true,
        'mensaje_id', v_mensaje_id,
        'respuesta_id', v_respuesta_id,
        'numero_respuesta', v_total
    );
exception
    when others then
        return jsonb_build_object(
            'ok', false,
            'error', 'error_interno',
            'error_detalle', sqlerrm,
            'error_state', sqlstate
        );
end;
$$;

revoke all on function public.registrar_respuesta_visitante(text, text, text, text, text) from public;
-- service_role llama via la edge function; tambien lo exponemos a authenticated por si testeamos
grant execute on function public.registrar_respuesta_visitante(text, text, text, text, text) to service_role;

comment on function public.registrar_respuesta_visitante is
    'Inserta una respuesta del visitante en el thread. Llamada por la edge function recibir-respuesta. Reabre el mensaje (respondido=false) para que vuelva a la bandeja.';

-- =============================================================================
-- Smoke tests
-- =============================================================================
-- select column_name, data_type from information_schema.columns
--  where table_schema = 'public' and table_name = 'respuestas_mensaje';
--
-- select * from public.mensajes_con_thread order by creado_en desc limit 3;
