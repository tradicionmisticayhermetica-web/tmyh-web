-- =============================================================================
-- Migracion 021: RPC publica para que un visitante se suscriba al newsletter
-- =============================================================================
-- Hasta hoy, las unicas formas de quedar suscripto eran:
--   a) Mandar el formulario de contacto con el checkbox de newsletter tildado.
--   b) Llegar via link con token y resubscribirse desde /newsletter/preferencias.
--
-- Ahora sumamos una caja de suscripcion en el footer que pide solo un email.
-- Esta migracion crea la RPC `newsletter_suscribir_email` que recibe el email
-- y, si todo esta bien:
--   - Si el email no existia en `contactos`: lo crea con newsletter_optin=true.
--   - Si existia y estaba en true: devuelve {ok:true, ya_estaba_suscripto:true}.
--   - Si existia y estaba en false: lo reactiva (optin=true) y registra evento.
--
-- Defensas anti-abuso (visible al usuario como "ya recibimos demasiadas
-- solicitudes, probá más tarde"):
--   - Rate limit por email: max 3 intentos cada 24h (defensa contra que
--     alguien intente suscribir el mismo email muchas veces).
--   - Rate limit por IP hash: max 10 intentos cada hora (alguien que rota
--     emails desde la misma IP).
--   - Validacion basica de email: no vacio, contiene @, longitud razonable.
--
-- Idempotente. Aplicar en SQL Editor.
-- =============================================================================

create or replace function public.newsletter_suscribir_email(
    p_email      text,
    p_user_agent text default null,
    p_ip_hash    text default null,
    p_origen     text default 'web:footer'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_email_clean text;
    v_contacto    record;
    v_intentos_email int;
    v_intentos_ip    int;
    v_tipo_evento text;
begin
    -- ----------------------------------------------------------------
    -- 1) Sanidad / validacion
    -- ----------------------------------------------------------------
    if p_email is null then
        return jsonb_build_object('ok', false, 'error', 'email_vacio');
    end if;

    v_email_clean := lower(trim(p_email));

    if length(v_email_clean) < 5 or length(v_email_clean) > 254 then
        return jsonb_build_object('ok', false, 'error', 'email_invalido');
    end if;

    -- Validacion regex muy liberal (no queremos rechazar mails legitimos
    -- raros). Solo chequeamos que tenga @ y un punto despues de @.
    if v_email_clean !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
        return jsonb_build_object('ok', false, 'error', 'email_invalido');
    end if;

    -- ----------------------------------------------------------------
    -- 2) Rate limit por email (3/24h)
    -- ----------------------------------------------------------------
    select count(*) into v_intentos_email
      from public.newsletter_eventos e
      join public.contactos c on c.id = e.contacto_id
     where lower(c.email) = v_email_clean
       and e.tipo in ('subscribed', 'resubscribed')
       and e.creado_en > now() - interval '24 hours';

    if v_intentos_email >= 3 then
        return jsonb_build_object('ok', false, 'error', 'limite_email');
    end if;

    -- ----------------------------------------------------------------
    -- 3) Rate limit por IP (10/h)
    -- ----------------------------------------------------------------
    if p_ip_hash is not null and length(p_ip_hash) > 0 then
        select count(*) into v_intentos_ip
          from public.newsletter_eventos
         where origen like 'web:%'
           and motivo = p_ip_hash  -- guardamos el hash en motivo cuando hay
           and creado_en > now() - interval '1 hour';

        if v_intentos_ip >= 10 then
            return jsonb_build_object('ok', false, 'error', 'limite_ip');
        end if;
    end if;

    -- ----------------------------------------------------------------
    -- 4) Buscar/crear el contacto
    -- ----------------------------------------------------------------
    select id, email, newsletter_optin
      into v_contacto
      from public.contactos
     where lower(email) = v_email_clean
     limit 1;

    if v_contacto.id is null then
        -- Contacto nuevo: lo creamos directamente con optin=true.
        insert into public.contactos (email, newsletter_optin, newsletter_optin_fecha)
        values (v_email_clean, true, now())
        returning id, email, newsletter_optin into v_contacto;

        v_tipo_evento := 'subscribed';

    elsif v_contacto.newsletter_optin = true then
        -- Ya estaba suscripto. No hacemos nada, ni siquiera registramos
        -- evento (para no inflar la tabla de eventos con duplicados).
        return jsonb_build_object(
            'ok', true,
            'ya_estaba_suscripto', true,
            'email', v_email_clean
        );

    else
        -- Existia pero estaba con optin=false. Lo reactivamos.
        update public.contactos
           set newsletter_optin       = true,
               newsletter_optin_fecha = now(),
               newsletter_optout_fecha = null
         where id = v_contacto.id;

        v_tipo_evento := 'resubscribed';
    end if;

    -- ----------------------------------------------------------------
    -- 5) Registrar evento de auditoria
    -- ----------------------------------------------------------------
    insert into public.newsletter_eventos (
        contacto_id, tipo, motivo, origen, user_agent
    )
    values (
        v_contacto.id,
        v_tipo_evento,
        p_ip_hash,    -- guardamos el ip_hash en motivo para rate-limit por IP
        coalesce(p_origen, 'web:footer'),
        p_user_agent
    );

    return jsonb_build_object(
        'ok', true,
        'ya_estaba_suscripto', false,
        'email', v_email_clean,
        'tipo', v_tipo_evento
    );
end;
$$;

revoke all on function public.newsletter_suscribir_email(text, text, text, text)
    from public;
grant execute on function public.newsletter_suscribir_email(text, text, text, text)
    to anon, authenticated;

comment on function public.newsletter_suscribir_email is
    'Suscribe un email al newsletter desde formularios publicos (caja del footer, lead magnet, etc.). Crea el contacto si no existia o lo reactiva si estaba dado de baja. Idempotente para emails ya suscriptos.';
