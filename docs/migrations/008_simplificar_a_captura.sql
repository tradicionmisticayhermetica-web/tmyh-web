-- =============================================================================
-- Migracion 008: simplificar panel a "captura en sitio, gestion en mail"
-- =============================================================================
-- Decision tomada: el sitio captura la consulta (queda en mensajes_contacto),
-- y la conversacion la gestiona Emanuel directamente desde Gmail (con
-- Reply-To: <email del visitante> en la notificacion).
--
-- Esta migracion revierte 006 y 007 (thread + inbound) y simplifica
-- panel_resumen para mostrar solo KPIs de captura, no de gestion.
--
-- IMPORTANTE: ejecutar en SQL Editor de Supabase. Es destructiva: borra la
-- tabla `respuestas_mensaje` y las columnas `respondido_*` y `respuesta_*`
-- de mensajes_contacto. Si en el futuro queres recuperar idas y vueltas en
-- BD, hay que volver a aplicar 006 y 007 (que siguen versionadas en docs).
--
-- COMO APLICAR:
--   Supabase Dashboard -> SQL Editor -> + New query -> pegar -> Run
-- =============================================================================

-- =============================================================================
-- 1. Drop vistas que dependen de respuestas_mensaje / columnas que vamos a borrar
-- =============================================================================
-- panel_resumen (vieja) usa la columna `respondido`; hay que dropearla antes
-- de tocar columnas. La recreamos al final con KPIs simples.
drop view if exists public.panel_resumen;
drop view if exists public.mensajes_con_thread;
drop view if exists public.mensajes_contacto_pendientes;

-- =============================================================================
-- 2. Drop RPCs de respuestas (todas las firmas posibles)
-- =============================================================================
drop function if exists public.registrar_respuesta_mensaje(uuid, text, text, text);
drop function if exists public.registrar_respuesta_mensaje(uuid, text, text);
drop function if exists public.registrar_respuesta_visitante(text, text, text, text, text);
drop function if exists public.marcar_mensaje_respondido(uuid, text, text);

-- =============================================================================
-- 3. Drop tabla respuestas_mensaje (cascada borra indices, policies, FKs)
-- =============================================================================
drop table if exists public.respuestas_mensaje cascade;

-- =============================================================================
-- 4. Drop indice asociado a respondido (si existe)
-- =============================================================================
drop index if exists public.mensajes_contacto_respondido_idx;

-- =============================================================================
-- 5. Drop columnas de respuesta en mensajes_contacto
-- =============================================================================
alter table public.mensajes_contacto drop column if exists respondido;
alter table public.mensajes_contacto drop column if exists respondido_en;
alter table public.mensajes_contacto drop column if exists respondido_por;
alter table public.mensajes_contacto drop column if exists respuesta_asunto;
alter table public.mensajes_contacto drop column if exists respuesta_cuerpo;

-- =============================================================================
-- 6. Recrear panel_resumen con KPIs simples (captura, no gestion)
-- =============================================================================
-- (Ya la dropeamos en el paso 1 para poder borrar columnas. Aca solo creamos.)
create view public.panel_resumen
with (security_invoker = true) as
select
    (select count(*) from public.mensajes_contacto) as total_mensajes,
    (select count(*) from public.mensajes_contacto
       where creado_en > now() - interval '7 days') as mensajes_ultima_semana,
    (select count(*) from public.mensajes_contacto
       where creado_en > now() - interval '30 days') as mensajes_ultimo_mes,
    (select count(*) from public.contactos) as total_contactos,
    (select count(*) from public.contactos
       where newsletter_optin = true) as suscriptores_newsletter;

comment on view public.panel_resumen is
    'KPIs basicos del sitio: cuantos mensajes, contactos y suscriptores. Solo visible para admins via RLS de las tablas base.';

-- =============================================================================
-- Smoke test
-- =============================================================================
-- select * from public.panel_resumen;
-- select column_name from information_schema.columns
--  where table_schema = 'public' and table_name = 'mensajes_contacto'
--  order by ordinal_position;
