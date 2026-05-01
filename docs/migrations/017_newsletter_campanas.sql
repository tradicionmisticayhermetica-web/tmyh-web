-- =============================================================================
-- Migracion 017: campanas y envios de newsletter
-- =============================================================================
-- Objetivo:
--   Soportar el flujo completo de envio de un newsletter, sumandose a la
--   infraestructura de suscripcion ya existente (migraciones 001 y 004).
--
-- Modelo en 3 tablas:
--   - newsletter_campanas        : 1 fila = 1 newsletter (asunto + intro + estado).
--   - newsletter_campana_posts   : posts del blog que se incluyen, con orden.
--   - newsletter_envios          : 1 fila por (campana x suscriptor) con su estado.
--
-- Flujo:
--   1) Admin crea campana en estado 'borrador' (asunto, intro Tiptap, posts).
--   2) Admin "encola" la campana (RPC newsletter_encolar_campana):
--      - Genera 1 fila en newsletter_envios por cada contacto con optin=true.
--      - Marca la campana como 'lista'.
--   3) La edge function process-newsletter-cola corre cada N horas:
--      - Llama newsletter_proximo_lote(limite) para reservar envios pendientes.
--      - Por cada uno, manda con Resend.
--      - Reporta resultado con newsletter_marcar_enviado / fallido.
--   4) Cuando todos los envios estan en estado terminal, la campana pasa a 'enviada'.
--
-- Reintentos:
--   Por pedido del producto, max_intentos = 1. Si un envio falla queda
--   visible con su error_mensaje y el admin decide manualmente que hacer.
--
-- Auto-desuscripcion en rebotes:
--   Trigger sobre newsletter_eventos: si entra un evento 'bounced' o
--   'complained', el contacto pasa a optin=false. Asi un mail que rebota
--   no entra en la siguiente campana.
--
-- Idempotente. Aplicar en Supabase -> SQL Editor.
-- =============================================================================


-- =============================================================================
-- 1. Tabla newsletter_campanas
-- =============================================================================
create table if not exists public.newsletter_campanas (
    id                uuid primary key default gen_random_uuid(),
    asunto            text not null,
    -- Texto rico que escribe Emanuel en el editor (TipTap):
    intro_html        text,
    intro_json        jsonb,
    -- Imagen de cabecera opcional (URL en Storage o externa):
    imagen_destacada  text,
    -- Segmento de destinatarios. Por ahora solo 'todos'. Mas adelante:
    --   'todos', 'etiqueta:vip', 'curso:simbologia', etc.
    segmento          text not null default 'todos',
    -- Estado del lifecycle de la campana:
    estado            text not null default 'borrador'
                       check (estado in (
                           'borrador',   -- editandose
                           'lista',      -- encolada y esperando que la cola la procese
                           'enviando',   -- la cola la esta procesando
                           'enviada',    -- todos los envios terminaron
                           'pausada',    -- el admin la freno (se puede reanudar)
                           'cancelada',  -- cancelada definitivamente, no manda mas
                           'fallida'     -- error grave a nivel campana (no pudo encolar)
                       )),
    -- Remitente fijo (siempre contacto@tradicionmisticayhermetica.com).
    -- Se guarda por trazabilidad si en el futuro queremos cambiarlo.
    remitente_email   text not null default 'contacto@tradicionmisticayhermetica.com',
    remitente_nombre  text not null default 'Tradicion Mistica y Hermetica',
    -- Contadores cache (los actualiza un trigger sobre newsletter_envios):
    total_destinatarios int not null default 0,
    enviados            int not null default 0,
    fallidos            int not null default 0,
    rebotados           int not null default 0,
    abiertos            int not null default 0,
    -- Audit:
    autor_id          uuid references public.perfiles(id) on delete set null,
    creada_en         timestamptz not null default now(),
    actualizada_en    timestamptz not null default now(),
    encolada_en       timestamptz,
    primer_envio_en   timestamptz,
    ultimo_envio_en   timestamptz,
    enviada_en        timestamptz
);

comment on table public.newsletter_campanas is
    'Una fila por newsletter. Estado simple: borrador -> lista -> enviando -> enviada.';
comment on column public.newsletter_campanas.intro_html is
    'HTML renderizado de la introduccion (TipTap). Es lo que se mete en el cuerpo del email.';
comment on column public.newsletter_campanas.intro_json is
    'JSON nativo de TipTap/ProseMirror para reabrir el editor.';
comment on column public.newsletter_campanas.segmento is
    'Filtro de destinatarios. Por ahora solo "todos". Reservado para etiquetas/cursos.';

create index if not exists newsletter_campanas_estado_idx
    on public.newsletter_campanas (estado, creada_en desc);


-- =============================================================================
-- 2. Tabla newsletter_campana_posts (junction con orden)
-- =============================================================================
create table if not exists public.newsletter_campana_posts (
    campana_id  uuid not null references public.newsletter_campanas(id) on delete cascade,
    post_id     uuid not null references public.posts(id) on delete cascade,
    orden       int  not null default 1,
    creado_en   timestamptz not null default now(),
    primary key (campana_id, post_id)
);

create unique index if not exists newsletter_campana_posts_orden_idx
    on public.newsletter_campana_posts (campana_id, orden);

comment on table public.newsletter_campana_posts is
    'Posts del blog incluidos en la campana, en el orden en que se renderizan en el email.';


-- =============================================================================
-- 3. Tabla newsletter_envios (un envio por destinatario)
-- =============================================================================
create table if not exists public.newsletter_envios (
    id              uuid primary key default gen_random_uuid(),
    campana_id      uuid not null references public.newsletter_campanas(id) on delete cascade,
    contacto_id     uuid not null references public.contactos(id) on delete cascade,
    -- Snapshot del email al momento de encolar. Si el contacto cambia el
    -- email despues, este snapshot se mantiene (lo que se mando, se mando).
    email_snapshot  text not null,
    nombre_snapshot text,
    -- Token de unsubscribe (snapshot por si rotamos tokens):
    token_unsubscribe uuid not null,
    estado          text not null default 'pendiente'
                     check (estado in (
                         'pendiente',           -- esperando turno
                         'enviando',            -- reservado por el worker
                         'enviado',             -- Resend acepto el envio
                         'fallido',             -- error transitorio o de Resend
                         'rebotado_definitivo', -- bounce hard, no reintentar
                         'cancelado'            -- la campana fue cancelada o pausada
                     )),
    intentos        int not null default 0,
    max_intentos    int not null default 1,
    -- Resend nos da un id por envio aceptado. Lo guardamos para correlacionar
    -- con eventos delivered/opened/bounced que llegan por webhook despues.
    resend_id       text,
    error_codigo    text,
    error_mensaje   text,
    -- Marcas temporales:
    creado_en       timestamptz not null default now(),
    reservado_en    timestamptz,
    enviado_en      timestamptz,
    abierto_en      timestamptz,
    rebotado_en     timestamptz,
    queja_en        timestamptz,
    -- Un mismo contacto no puede recibir la misma campana dos veces.
    unique (campana_id, contacto_id)
);

comment on table public.newsletter_envios is
    'Estado por destinatario de cada campana. Un mismo contacto solo aparece una vez por campana.';

create index if not exists newsletter_envios_estado_idx
    on public.newsletter_envios (estado, creado_en);
create index if not exists newsletter_envios_campana_idx
    on public.newsletter_envios (campana_id, estado);
create index if not exists newsletter_envios_resend_idx
    on public.newsletter_envios (resend_id)
    where resend_id is not null;


-- =============================================================================
-- 4. Trigger: actualizada_en de campanas
-- =============================================================================
drop trigger if exists newsletter_campanas_actualizada_en on public.newsletter_campanas;
create trigger newsletter_campanas_actualizada_en
    before update on public.newsletter_campanas
    for each row execute function public.set_actualizado_en();
-- Nota: la funcion set_actualizado_en() escribe en NEW.actualizado_en. Como
-- nuestra columna se llama actualizada_en (femenino), hacemos un trigger
-- propio mas abajo. Reemplazamos la asignacion por una funcion local.

create or replace function public.set_newsletter_campana_actualizada_en()
returns trigger
language plpgsql
as $$
begin
    new.actualizada_en = now();
    return new;
end;
$$;

drop trigger if exists newsletter_campanas_actualizada_en on public.newsletter_campanas;
create trigger newsletter_campanas_actualizada_en
    before update on public.newsletter_campanas
    for each row execute function public.set_newsletter_campana_actualizada_en();


-- =============================================================================
-- 5. Trigger: contadores cache en newsletter_campanas
-- =============================================================================
-- Cada vez que cambia el estado de un envio, recalculamos los contadores
-- de la campana. Es un AFTER trigger por fila.
create or replace function public.refrescar_contadores_campana(p_campana_id uuid)
returns void
language plpgsql
as $$
begin
    update public.newsletter_campanas c
       set total_destinatarios = (
              select count(*) from public.newsletter_envios e
               where e.campana_id = p_campana_id
           ),
           enviados = (
              select count(*) from public.newsletter_envios e
               where e.campana_id = p_campana_id and e.estado = 'enviado'
           ),
           fallidos = (
              select count(*) from public.newsletter_envios e
               where e.campana_id = p_campana_id and e.estado = 'fallido'
           ),
           rebotados = (
              select count(*) from public.newsletter_envios e
               where e.campana_id = p_campana_id and e.estado = 'rebotado_definitivo'
           ),
           abiertos = (
              select count(*) from public.newsletter_envios e
               where e.campana_id = p_campana_id and e.abierto_en is not null
           ),
           ultimo_envio_en = (
              select max(e.enviado_en) from public.newsletter_envios e
               where e.campana_id = p_campana_id
           ),
           primer_envio_en = coalesce(c.primer_envio_en, (
              select min(e.enviado_en) from public.newsletter_envios e
               where e.campana_id = p_campana_id
           ))
     where c.id = p_campana_id;
end;
$$;

create or replace function public.trigger_refrescar_campana()
returns trigger
language plpgsql
as $$
begin
    if (tg_op = 'INSERT') then
        perform public.refrescar_contadores_campana(new.campana_id);
        return new;
    elsif (tg_op = 'DELETE') then
        perform public.refrescar_contadores_campana(old.campana_id);
        return old;
    else
        perform public.refrescar_contadores_campana(new.campana_id);
        if old.campana_id is distinct from new.campana_id then
            perform public.refrescar_contadores_campana(old.campana_id);
        end if;
        return new;
    end if;
end;
$$;

drop trigger if exists newsletter_envios_refrescar_campana on public.newsletter_envios;
create trigger newsletter_envios_refrescar_campana
    after insert or update or delete on public.newsletter_envios
    for each row execute function public.trigger_refrescar_campana();


-- =============================================================================
-- 6. Trigger: auto-desuscripcion en bounce/complaint
-- =============================================================================
-- Si entra un evento 'bounced' o 'complained', el contacto pasa a optin=false
-- automaticamente. Asi nunca mas entra en una campana mientras no se vuelva
-- a suscribir manualmente.
create or replace function public.trigger_autounsubscribe_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.tipo in ('bounced', 'complained') then
        update public.contactos
           set newsletter_optin        = false,
               newsletter_optout_fecha = coalesce(newsletter_optout_fecha, now())
         where id = new.contacto_id
           and newsletter_optin = true;
    end if;
    return new;
end;
$$;

drop trigger if exists newsletter_eventos_autounsubscribe on public.newsletter_eventos;
create trigger newsletter_eventos_autounsubscribe
    after insert on public.newsletter_eventos
    for each row execute function public.trigger_autounsubscribe_evento();


-- =============================================================================
-- 7. RLS
-- =============================================================================
alter table public.newsletter_campanas      enable row level security;
alter table public.newsletter_campana_posts enable row level security;
alter table public.newsletter_envios        enable row level security;

-- Solo admins pueden ver y modificar las tres tablas.
-- (Los visitantes nunca tocan estas filas; los unsubscribe van por contactos
--  + token, que ya tiene su propia RPC publica.)

drop policy if exists nl_campanas_admin_all on public.newsletter_campanas;
create policy nl_campanas_admin_all on public.newsletter_campanas
    for all using (public.es_admin())
    with check (public.es_admin());

drop policy if exists nl_campana_posts_admin_all on public.newsletter_campana_posts;
create policy nl_campana_posts_admin_all on public.newsletter_campana_posts
    for all using (public.es_admin())
    with check (public.es_admin());

drop policy if exists nl_envios_admin_all on public.newsletter_envios;
create policy nl_envios_admin_all on public.newsletter_envios
    for all using (public.es_admin())
    with check (public.es_admin());


-- =============================================================================
-- 8. RPC: newsletter_encolar_campana
-- =============================================================================
-- Genera 1 fila en newsletter_envios por cada contacto con newsletter_optin=true
-- y, si pertenece al segmento, lo agrega. Pasa la campana a estado 'lista'.
--
-- Idempotente: si la campana ya tiene envios encolados, no duplica filas
-- (gracias al UNIQUE (campana_id, contacto_id)).
-- =============================================================================
create or replace function public.newsletter_encolar_campana(p_campana_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_campana record;
    v_insertados int;
begin
    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'no_autorizado');
    end if;

    select * into v_campana
      from public.newsletter_campanas
     where id = p_campana_id
       for update;

    if v_campana.id is null then
        return jsonb_build_object('ok', false, 'error', 'campana_no_existe');
    end if;

    if v_campana.estado not in ('borrador', 'lista', 'pausada') then
        return jsonb_build_object(
            'ok', false,
            'error', 'estado_no_encolable',
            'estado_actual', v_campana.estado
        );
    end if;

    if coalesce(trim(v_campana.asunto), '') = '' then
        return jsonb_build_object('ok', false, 'error', 'asunto_vacio');
    end if;

    -- Insertamos los pendientes que falten. ON CONFLICT salta los ya creados
    -- (por el unique campana_id + contacto_id).
    insert into public.newsletter_envios (
        campana_id, contacto_id, email_snapshot, nombre_snapshot, token_unsubscribe
    )
    select
        p_campana_id,
        c.id,
        c.email,
        nullif(trim(coalesce(c.nombre, '') || ' ' || coalesce(c.apellido, '')), ''),
        c.newsletter_token_unsubscribe
      from public.contactos c
     where c.newsletter_optin = true
       and c.email is not null
       and trim(c.email) <> ''
    on conflict (campana_id, contacto_id) do nothing;

    get diagnostics v_insertados = row_count;

    update public.newsletter_campanas
       set estado      = 'lista',
           encolada_en = coalesce(encolada_en, now())
     where id = p_campana_id;

    return jsonb_build_object(
        'ok', true,
        'campana_id', p_campana_id,
        'destinatarios_nuevos', v_insertados,
        'estado', 'lista'
    );
exception
    when others then
        return jsonb_build_object(
            'ok', false,
            'error', 'error_interno',
            'error_detalle', sqlerrm
        );
end;
$$;

comment on function public.newsletter_encolar_campana is
    'Pasa una campana de borrador a lista, generando un envio por suscriptor activo.';


-- =============================================================================
-- 9. RPC: pausar / reanudar / cancelar
-- =============================================================================
create or replace function public.newsletter_pausar_campana(p_campana_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'no_autorizado');
    end if;

    update public.newsletter_campanas
       set estado = 'pausada'
     where id = p_campana_id
       and estado in ('lista', 'enviando');

    if not found then
        return jsonb_build_object('ok', false, 'error', 'estado_no_pausable');
    end if;

    return jsonb_build_object('ok', true, 'estado', 'pausada');
end;
$$;

create or replace function public.newsletter_reanudar_campana(p_campana_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'no_autorizado');
    end if;

    update public.newsletter_campanas
       set estado = 'lista'
     where id = p_campana_id
       and estado = 'pausada';

    if not found then
        return jsonb_build_object('ok', false, 'error', 'no_estaba_pausada');
    end if;

    return jsonb_build_object('ok', true, 'estado', 'lista');
end;
$$;

create or replace function public.newsletter_cancelar_campana(p_campana_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_cancelados int;
begin
    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'no_autorizado');
    end if;

    -- Cancela la campana si esta en un estado cancelable.
    update public.newsletter_campanas
       set estado = 'cancelada'
     where id = p_campana_id
       and estado in ('borrador', 'lista', 'enviando', 'pausada');

    if not found then
        return jsonb_build_object('ok', false, 'error', 'estado_no_cancelable');
    end if;

    -- Cancela los envios todavia pendientes o reservados.
    update public.newsletter_envios
       set estado = 'cancelado'
     where campana_id = p_campana_id
       and estado in ('pendiente', 'enviando');

    get diagnostics v_cancelados = row_count;

    return jsonb_build_object(
        'ok', true,
        'estado', 'cancelada',
        'envios_cancelados', v_cancelados
    );
end;
$$;


-- =============================================================================
-- 10. RPC: newsletter_proximo_lote
-- =============================================================================
-- Reserva (estado='enviando') hasta p_limite envios pendientes y los devuelve
-- al worker para que los mande con Resend. Solo procesa campanas en estado
-- 'lista' o 'enviando' (las pausadas/canceladas no entran).
--
-- Si la campana estaba 'lista' y empezamos a procesar, la marcamos 'enviando'.
-- =============================================================================
create or replace function public.newsletter_proximo_lote(p_limite int default 10)
returns table (
    envio_id          uuid,
    campana_id        uuid,
    asunto            text,
    intro_html        text,
    imagen_destacada  text,
    remitente_email   text,
    remitente_nombre  text,
    contacto_id       uuid,
    email_snapshot    text,
    nombre_snapshot   text,
    token_unsubscribe uuid
)
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.es_admin() then
        raise exception 'no_autorizado';
    end if;

    -- Pasar campanas 'lista' a 'enviando' antes de tomar el lote.
    update public.newsletter_campanas c
       set estado = 'enviando'
     where c.estado = 'lista'
       and exists (
           select 1 from public.newsletter_envios e
            where e.campana_id = c.id
              and e.estado = 'pendiente'
       );

    return query
    with reservados as (
        update public.newsletter_envios e
           set estado       = 'enviando',
               intentos     = e.intentos + 1,
               reservado_en = now()
          from public.newsletter_campanas c
         where e.id in (
                  select e2.id
                    from public.newsletter_envios e2
                    join public.newsletter_campanas c2 on c2.id = e2.campana_id
                   where e2.estado = 'pendiente'
                     and c2.estado in ('lista', 'enviando')
                   order by c2.encolada_en asc nulls last, e2.creado_en asc
                   limit greatest(p_limite, 1)
                   for update of e2 skip locked
              )
           and c.id = e.campana_id
        returning
            e.id, e.campana_id, e.contacto_id, e.email_snapshot,
            e.nombre_snapshot, e.token_unsubscribe,
            c.asunto, c.intro_html, c.imagen_destacada,
            c.remitente_email, c.remitente_nombre
    )
    select
        r.id,
        r.campana_id,
        r.asunto,
        r.intro_html,
        r.imagen_destacada,
        r.remitente_email,
        r.remitente_nombre,
        r.contacto_id,
        r.email_snapshot,
        r.nombre_snapshot,
        r.token_unsubscribe
      from reservados r;
end;
$$;

comment on function public.newsletter_proximo_lote is
    'Reserva y devuelve hasta N envios pendientes para que un worker los mande por Resend.';


-- =============================================================================
-- 11. RPC: marcar_enviado / marcar_fallido
-- =============================================================================
create or replace function public.newsletter_marcar_enviado(
    p_envio_id  uuid,
    p_resend_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_envio record;
begin
    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'no_autorizado');
    end if;

    update public.newsletter_envios
       set estado     = 'enviado',
           resend_id  = p_resend_id,
           enviado_en = now(),
           error_codigo = null,
           error_mensaje = null
     where id = p_envio_id
    returning campana_id into v_envio;

    if v_envio.campana_id is null then
        return jsonb_build_object('ok', false, 'error', 'envio_no_existe');
    end if;

    -- Si no quedan envios pendientes/enviando en la campana, marcarla 'enviada'.
    perform public.cerrar_campana_si_corresponde(v_envio.campana_id);

    return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.newsletter_marcar_fallido(
    p_envio_id   uuid,
    p_codigo     text,
    p_mensaje    text,
    p_es_bounce  boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_envio record;
begin
    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'no_autorizado');
    end if;

    update public.newsletter_envios
       set estado = case when p_es_bounce then 'rebotado_definitivo' else 'fallido' end,
           error_codigo  = p_codigo,
           error_mensaje = p_mensaje,
           rebotado_en   = case when p_es_bounce then now() else rebotado_en end
     where id = p_envio_id
    returning campana_id, contacto_id into v_envio;

    if v_envio.campana_id is null then
        return jsonb_build_object('ok', false, 'error', 'envio_no_existe');
    end if;

    -- Si fue rebote duro, registramos un evento (que dispara el trigger
    -- autounsubscribe y deja al contacto en optin=false).
    if p_es_bounce then
        insert into public.newsletter_eventos (contacto_id, tipo, motivo, origen)
        values (v_envio.contacto_id, 'bounced', p_mensaje, 'resend:envio');
    end if;

    perform public.cerrar_campana_si_corresponde(v_envio.campana_id);

    return jsonb_build_object('ok', true);
end;
$$;


-- =============================================================================
-- 12. Helper: cerrar_campana_si_corresponde
-- =============================================================================
-- Si una campana ya no tiene envios pendientes ni enviando, la pasa a 'enviada'.
create or replace function public.cerrar_campana_si_corresponde(p_campana_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_pendientes int;
    v_estado     text;
begin
    select estado into v_estado
      from public.newsletter_campanas
     where id = p_campana_id;

    if v_estado not in ('lista', 'enviando') then
        return;
    end if;

    select count(*) into v_pendientes
      from public.newsletter_envios
     where campana_id = p_campana_id
       and estado in ('pendiente', 'enviando');

    if v_pendientes = 0 then
        update public.newsletter_campanas
           set estado     = 'enviada',
               enviada_en = now()
         where id = p_campana_id;
    end if;
end;
$$;


-- =============================================================================
-- 13. Permisos: las RPCs admin solo pueden ser llamadas por authenticated.
--     La logica interna verifica es_admin().
-- =============================================================================
revoke all on function public.newsletter_encolar_campana(uuid) from public;
revoke all on function public.newsletter_pausar_campana(uuid) from public;
revoke all on function public.newsletter_reanudar_campana(uuid) from public;
revoke all on function public.newsletter_cancelar_campana(uuid) from public;
revoke all on function public.newsletter_proximo_lote(int) from public;
revoke all on function public.newsletter_marcar_enviado(uuid, text) from public;
revoke all on function public.newsletter_marcar_fallido(uuid, text, text, boolean) from public;

grant execute on function public.newsletter_encolar_campana(uuid)         to authenticated;
grant execute on function public.newsletter_pausar_campana(uuid)          to authenticated;
grant execute on function public.newsletter_reanudar_campana(uuid)        to authenticated;
grant execute on function public.newsletter_cancelar_campana(uuid)        to authenticated;
grant execute on function public.newsletter_proximo_lote(int)             to authenticated;
grant execute on function public.newsletter_marcar_enviado(uuid, text)    to authenticated;
grant execute on function public.newsletter_marcar_fallido(uuid, text, text, boolean) to authenticated;


-- =============================================================================
-- 14. Smoke tests (descomentar y correr para verificar)
-- =============================================================================
-- -- a) Crear campana de prueba (login como admin):
-- insert into public.newsletter_campanas (asunto, intro_html)
-- values ('Boletin de prueba', '<p>Hola, esto es una prueba.</p>')
-- returning id;
--
-- -- b) Encolarla (reemplazar UUID):
-- select public.newsletter_encolar_campana('00000000-0000-0000-0000-000000000000'::uuid);
--
-- -- c) Ver envios generados:
-- select estado, count(*) from public.newsletter_envios
--  where campana_id = '00000000-0000-0000-0000-000000000000'::uuid
--  group by estado;
--
-- -- d) Tomar un lote (simulando al worker):
-- select * from public.newsletter_proximo_lote(2);
--
-- -- e) Marcar uno como enviado:
-- select public.newsletter_marcar_enviado(
--    '<envio_id>'::uuid,
--    'resend_xxx_simulado'
-- );
--
-- -- f) Ver contadores cache de la campana:
-- select asunto, estado, total_destinatarios, enviados, fallidos, abiertos
--   from public.newsletter_campanas
--  where id = '00000000-0000-0000-0000-000000000000'::uuid;
