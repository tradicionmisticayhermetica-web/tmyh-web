-- =============================================================================
-- Migracion 020: tracking de eventos de Resend en newsletter_envios
-- =============================================================================
-- Cuando Resend acepta un envio, le pasamos su id (resend_id) que guardamos
-- en newsletter_envios.resend_id. Posteriormente, Resend nos manda webhooks
-- asincronicos con eventos del ciclo de vida del email:
--
--   - email.delivered       => llego al inbox del destinatario.
--   - email.opened          => el destinatario abrio el mail (1+ veces).
--   - email.bounced         => rebote duro (mailbox no existe / dominio caido).
--   - email.complained      => el destinatario marco el mail como spam.
--
-- Esta migracion agrega las columnas de tracking faltantes y la RPC que la
-- edge function `resend-eventos` invocara cuando reciba cada webhook.
--
-- Diseno:
--   - Eventos terminales (delivered/bounced/complained) son IDEMPOTENTES:
--     si llegan dos veces, la segunda es no-op. Lo logramos chequeando si
--     la columna correspondiente (entregado_en, rebotado_en, queja_en)
--     ya esta seteada antes de actuar.
--   - opened tambien es idempotente para abierto_en (solo se setea la PRIMERA
--     vez), pero el contador `aperturas` SI sube cada vez. Resend ya dedupa
--     por su lado, asi que la cuenta es razonablemente confiable.
--   - Bounce y queja insertan en newsletter_eventos (con tipo correspondiente),
--     lo que dispara el trigger ya existente que pasa el contacto a optin=false.
--
-- Idempotente. Aplicar en SQL Editor.
-- =============================================================================


-- =============================================================================
-- 1. Columnas nuevas en newsletter_envios
-- =============================================================================
alter table public.newsletter_envios
    add column if not exists entregado_en timestamptz;

alter table public.newsletter_envios
    add column if not exists aperturas int not null default 0;

comment on column public.newsletter_envios.entregado_en is
    'Cuando Resend confirmo que el mail llego al inbox (evento email.delivered).';
comment on column public.newsletter_envios.aperturas is
    'Cantidad de veces que el destinatario abrio el mail (evento email.opened). Resend dedupa por su lado.';


-- Indice para buscar rapido por resend_id desde la edge function de webhooks.
create index if not exists newsletter_envios_resend_id_idx
    on public.newsletter_envios (resend_id)
    where resend_id is not null;


-- =============================================================================
-- 2. RPC: newsletter_registrar_evento_resend
-- =============================================================================
-- Llamada desde la edge function `resend-eventos` cuando llega un webhook.
-- Es la unica forma en que se actualizan estos contadores; toda la logica de
-- idempotencia y disparo de auto-baja vive aca.
--
-- Parametros:
--   p_resend_id  el id que devolvio Resend al aceptar el envio.
--   p_tipo       el tipo del evento (sin prefijo "email."): delivered, opened,
--                bounced, complained, sent, delivery_delayed, etc.
--   p_payload    el payload completo del webhook (jsonb), por si hace falta
--                guardarlo despues para auditar.
--
-- Devuelve jsonb con { ok, accion, envio_id }.
--   - accion: 'registrado', 'duplicado', 'envio_no_encontrado', 'tipo_ignorado'.
-- =============================================================================
create or replace function public.newsletter_registrar_evento_resend(
    p_resend_id text,
    p_tipo      text,
    p_payload   jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_envio          public.newsletter_envios%rowtype;
    v_aperturas_eran int;
begin
    if p_resend_id is null or p_tipo is null then
        return jsonb_build_object('ok', false, 'error', 'parametros_faltantes');
    end if;

    select * into v_envio
      from public.newsletter_envios
     where resend_id = p_resend_id
     order by enviado_en desc nulls last
     limit 1;

    if v_envio.id is null then
        return jsonb_build_object(
            'ok', true,
            'accion', 'envio_no_encontrado',
            'resend_id', p_resend_id
        );
    end if;

    -- ----------------------------------------------------------------
    -- Despachar segun tipo
    -- ----------------------------------------------------------------
    if p_tipo = 'delivered' then
        if v_envio.entregado_en is not null then
            return jsonb_build_object('ok', true, 'accion', 'duplicado', 'envio_id', v_envio.id);
        end if;
        update public.newsletter_envios
           set entregado_en = now()
         where id = v_envio.id;

    elsif p_tipo = 'opened' then
        v_aperturas_eran := coalesce(v_envio.aperturas, 0);
        update public.newsletter_envios
           set abierto_en = coalesce(abierto_en, now()),
               aperturas  = coalesce(aperturas, 0) + 1
         where id = v_envio.id;
        -- Solo contar +1 en `campanas.abiertos` la primera apertura.
        if v_aperturas_eran = 0 then
            update public.newsletter_campanas
               set abiertos = coalesce(abiertos, 0) + 1
             where id = v_envio.campana_id;
        end if;

    elsif p_tipo = 'bounced' then
        if v_envio.rebotado_en is not null then
            return jsonb_build_object('ok', true, 'accion', 'duplicado', 'envio_id', v_envio.id);
        end if;
        update public.newsletter_envios
           set rebotado_en = now(),
               estado      = case
                                 when estado in ('enviado', 'fallido', 'pendiente', 'enviando')
                                     then 'rebotado_definitivo'
                                 else estado
                              end
         where id = v_envio.id;
        -- Insertar en newsletter_eventos -> trigger desuscribe el contacto.
        insert into public.newsletter_eventos (contacto_id, tipo, motivo, origen, user_agent)
        values (
            v_envio.contacto_id,
            'bounced',
            coalesce(p_payload->>'reason', p_payload#>>'{data,reason}'),
            'resend:webhook',
            null
        );

    elsif p_tipo = 'complained' then
        if v_envio.queja_en is not null then
            return jsonb_build_object('ok', true, 'accion', 'duplicado', 'envio_id', v_envio.id);
        end if;
        update public.newsletter_envios
           set queja_en = now()
         where id = v_envio.id;
        insert into public.newsletter_eventos (contacto_id, tipo, motivo, origen, user_agent)
        values (
            v_envio.contacto_id,
            'complained',
            null,
            'resend:webhook',
            null
        );

    else
        -- Tipos que no nos interesan (sent, delivery_delayed, scheduled, ...).
        return jsonb_build_object('ok', true, 'accion', 'tipo_ignorado', 'tipo', p_tipo);
    end if;

    return jsonb_build_object('ok', true, 'accion', 'registrado', 'envio_id', v_envio.id, 'tipo', p_tipo);
end;
$$;

revoke all on function public.newsletter_registrar_evento_resend(text, text, jsonb) from public;
grant execute on function public.newsletter_registrar_evento_resend(text, text, jsonb) to service_role;

comment on function public.newsletter_registrar_evento_resend is
    'Registra un evento de webhook de Resend en el envio correspondiente. Idempotente para delivered/bounced/complained; opened siempre suma al contador.';
