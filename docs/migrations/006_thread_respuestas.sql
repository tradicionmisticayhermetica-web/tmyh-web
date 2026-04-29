-- =============================================================================
-- Migracion 006: hilo de respuestas + contador
-- =============================================================================
-- Hasta la migracion 005 cada mensaje guardaba UNA sola respuesta (sobrescrita
-- en mensajes_contacto). Ahora queremos preservar todas las idas (cada vez que
-- un admin responde queda registrada como una fila aparte) y contarlas para
-- mostrar el hilo completo en el panel.
--
-- Crea:
--   1. Tabla `public.respuestas_mensaje` (1 fila por respuesta enviada).
--   2. RLS (solo admins leen).
--   3. RPC `registrar_respuesta_mensaje(...)` que reemplaza al
--      `marcar_mensaje_respondido(...)` anterior: inserta en el thread y
--      mantiene mensajes_contacto sincronizado con la ultima respuesta.
--   4. Vista `mensajes_con_thread` con campos extra `total_respuestas` y
--      `ultima_respuesta_en` para que el panel muestre el contador en la lista.
--   5. Backfill: convierte las respuestas viejas (que vivian solo en
--      mensajes_contacto.respuesta_*) en filas del thread.
--
-- Idempotente. Se puede correr varias veces.
--
-- COMO APLICAR:
--   Supabase Dashboard -> SQL Editor -> pegar el contenido -> Run.
-- =============================================================================

-- =============================================================================
-- 1. Tabla respuestas_mensaje
-- =============================================================================
create table if not exists public.respuestas_mensaje (
    id                    uuid primary key default gen_random_uuid(),
    mensaje_id            uuid not null
                              references public.mensajes_contacto(id) on delete cascade,
    respondido_por        uuid references auth.users(id) on delete set null,
    respondido_por_email  text not null,
    asunto                text not null,
    cuerpo                text not null,
    enviado_en            timestamptz not null default now()
);

comment on table public.respuestas_mensaje is
    'Cada respuesta enviada por un admin a una consulta del formulario. Permite preservar el hilo completo y contar idas.';

create index if not exists respuestas_mensaje_mensaje_idx
    on public.respuestas_mensaje (mensaje_id, enviado_en desc);

create index if not exists respuestas_mensaje_enviado_idx
    on public.respuestas_mensaje (enviado_en desc);

-- =============================================================================
-- 2. RLS
-- =============================================================================
alter table public.respuestas_mensaje enable row level security;

-- Solo admins leen el thread
drop policy if exists respuestas_admin_select on public.respuestas_mensaje;
create policy respuestas_admin_select on public.respuestas_mensaje
    for select using (public.es_admin());

-- No hay policy de INSERT directa: solo se inserta via RPC `registrar_respuesta_mensaje`
-- (security definer). Esto evita que un admin pueda insertar mails falsos sin
-- pasar por la edge function.

-- =============================================================================
-- 3. RPC registrar_respuesta_mensaje
-- =============================================================================
-- Reemplaza al `marcar_mensaje_respondido`. Inserta en el thread y mantiene
-- mensajes_contacto sincronizado. Devuelve el ID de la respuesta y el numero
-- (1, 2, 3, ...) que tiene en el thread.
create or replace function public.registrar_respuesta_mensaje(
    p_mensaje_id uuid,
    p_asunto     text,
    p_cuerpo     text
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

    -- Email del admin (para mostrar en el thread quien respondio)
    select email::text into v_email
      from public.perfiles
     where id = v_uid;

    -- Verificamos que el mensaje exista
    perform 1 from public.mensajes_contacto where id = p_mensaje_id;
    if not found then
        return jsonb_build_object('ok', false, 'error', 'mensaje_no_encontrado');
    end if;

    -- Insertamos en el thread
    insert into public.respuestas_mensaje (
        mensaje_id, respondido_por, respondido_por_email, asunto, cuerpo
    ) values (
        p_mensaje_id, v_uid, coalesce(v_email, ''), trim(p_asunto), p_cuerpo
    )
    returning id into v_resp;

    -- Sincronizamos mensajes_contacto con la ultima respuesta
    update public.mensajes_contacto
       set respondido       = true,
           respondido_en    = coalesce(respondido_en, now()),
           respondido_por   = coalesce(respondido_por, v_uid),
           respuesta_asunto = trim(p_asunto),
           respuesta_cuerpo = p_cuerpo
     where id = p_mensaje_id;

    -- Contamos cuantas respuestas hay ahora
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

revoke all on function public.registrar_respuesta_mensaje(uuid, text, text) from public;
grant execute on function public.registrar_respuesta_mensaje(uuid, text, text) to authenticated;

comment on function public.registrar_respuesta_mensaje is
    'Inserta una respuesta en el thread y marca el mensaje como respondido. Solo admins.';

-- =============================================================================
-- 4. Vista enriquecida con contador
-- =============================================================================
-- Drop primero (si la columna firma cambia entre re-ejecuciones)
drop view if exists public.mensajes_con_thread;
create view public.mensajes_con_thread
with (security_invoker = true) as
select
    m.*,
    coalesce(r.total_respuestas, 0)::int as total_respuestas,
    r.ultima_respuesta_en
from public.mensajes_contacto m
left join (
    select
        mensaje_id,
        count(*) as total_respuestas,
        max(enviado_en) as ultima_respuesta_en
      from public.respuestas_mensaje
     group by mensaje_id
) r on r.mensaje_id = m.id;

comment on view public.mensajes_con_thread is
    'Mensajes de contacto + total_respuestas (cantidad de idas) y ultima_respuesta_en. Solo visible para admins via RLS de la tabla base.';

-- =============================================================================
-- 5. Backfill: respuestas viejas -> thread
-- =============================================================================
-- Para mensajes que ya estan respondidos pero todavia no tienen filas en el
-- thread, creamos una fila inicial a partir de los campos respuesta_* que
-- vivian sueltos en mensajes_contacto. Asi el panel muestra el historico ya
-- existente.
insert into public.respuestas_mensaje (
    mensaje_id, respondido_por, respondido_por_email, asunto, cuerpo, enviado_en
)
select
    m.id,
    m.respondido_por,
    coalesce(p.email::text, '(sin registro)'),
    coalesce(m.respuesta_asunto, '(sin asunto)'),
    coalesce(m.respuesta_cuerpo, '(cuerpo no preservado)'),
    coalesce(m.respondido_en, now())
  from public.mensajes_contacto m
  left join public.perfiles p on p.id = m.respondido_por
 where m.respondido = true
   and not exists (
       select 1 from public.respuestas_mensaje r where r.mensaje_id = m.id
   );

-- =============================================================================
-- Smoke tests (descomentar para validar)
-- =============================================================================
-- select * from public.mensajes_con_thread order by creado_en desc limit 5;
-- select * from public.respuestas_mensaje order by enviado_en desc limit 5;
