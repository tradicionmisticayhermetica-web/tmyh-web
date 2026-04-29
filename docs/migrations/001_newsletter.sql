-- =============================================================================
-- Migracion 001: soporte newsletter
-- =============================================================================
-- Agrega columnas a public.contactos:
--   - newsletter_optin: consentimiento explicito para recibir newsletter.
--   - newsletter_optin_fecha: cuando se marco el consentimiento.
--   - etiquetas: array libre para segmentar (ej: {'alumno-simbolia','vip'}).
--
-- Segura e idempotente (IF NOT EXISTS).
-- Copiar en Supabase -> SQL Editor -> Run.
-- =============================================================================

alter table public.contactos
    add column if not exists newsletter_optin boolean not null default false;

alter table public.contactos
    add column if not exists newsletter_optin_fecha timestamptz;

alter table public.contactos
    add column if not exists etiquetas text[] not null default '{}';

comment on column public.contactos.newsletter_optin is
    'True si el contacto consintio recibir newsletter. Default false (importante por LGPD/GDPR).';
comment on column public.contactos.newsletter_optin_fecha is
    'Fecha en que se registro el consentimiento. Util como evidencia.';
comment on column public.contactos.etiquetas is
    'Tags libres para segmentar: alumno, vip, curso-x, etc.';

-- Indice por etiquetas para filtros rapidos.
create index if not exists contactos_etiquetas_gin
    on public.contactos using gin (etiquetas);
