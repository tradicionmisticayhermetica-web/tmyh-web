# Plan de migración TM&H

Plan concreto para pasar de WordPress actual en Ferozo (Donweb) a un sitio nuevo en TypeScript, con Supabase como base de datos de usuarios.

## Piezas y dónde viven

- **Ferozo / Donweb**: hosting que sirve HTML/PHP. Hoy corre WordPress en `public_html/`. Se usará para servir el sitio nuevo cuando esté listo.
- **GitHub**: control de versiones del código.
  - Repo `tmyh-wp-legacy` (privado): backup del WordPress actual (archivo histórico).
  - Repo `tmyh-web` (privado): sitio nuevo en Astro + TypeScript + Tailwind. Vinculado a `public_html/tmyh-web/` por Git de Ferozo.
- **Supabase**: Postgres gestionado con API y Auth. Vive en la nube de Supabase, no en Ferozo. El sitio lo consume desde el cliente/SSR con URL y anon key.

No existe vínculo directo Ferozo - Supabase. Se conectan desde el código del sitio nuevo.

## Fases

### Fase 1 - Backup del WordPress actual

- Exportar con plugin All-in-One WP Migration (`.wpress`).
- Extraer con `scripts/extract_wpress.py` a `wp-extracted/`.
- `.gitignore` razonable (ver `.gitignore` en `wp-extracted/`).
- `git init` y primer commit locales.
- Crear repo `tmyh-wp-legacy` privado en GitHub y hacer push.
- `database.sql` NO va al repo (contiene hashes y emails). Se guarda en disco + copia cifrada en Drive.

### Fase 2 - Base de datos de usuarios en Supabase

- Proyecto Supabase creado con RLS automático activable.
- Esquema inicial: `contactos`, `inscripciones`. Ver `docs/schema-supabase.sql`.
- Por ahora solo admin accede a las tablas (Dashboard o scripts locales con service_role). El frontend se integrará más adelante.

### Fase 3 - Importación de usuarios

Fuentes:

- Ultimate Member (WordPress) via `database.sql` o plugin de export a CSV.
- Google Classroom via Takeout/CSV manual por cada una de las ~7 cuentas, o Google Apps Script.

Normalización:

- Emails en minúscula y sin espacios.
- Deduplicación por email.
- Un contacto puede tener varias inscripciones (distintas cuentas de Classroom, distintos cursos).

Script de importación con upsert por email. Volumen estimado: ~2000 personas.

### Fase 4 - Sitio nuevo

Stack: Astro + TypeScript + Tailwind.

Estructura mínima:

- `/` Inicio.
- `/cursos` listado y fichas.
- `/blog` entradas migradas del XML.
- `/hermetismo` página.
- `/contacto`.

Contenido semilla tomado del XML `tmamph.WordPress.2026-04-20.xml`.

Flujo de trabajo:

- Desarrollo local en `C:\Users\Juan\Desktop\TMyH` o en una subcarpeta limpia.
- Push a GitHub `tmyh-web` (rama `main`).
- En Ferozo, sección GIT, botón Sincronizar -> `git pull` a `public_html/tmyh-web/`.
- Se ve en `https://tudominio.com/tmyh-web/` para pruebas.

### Fase 5 - Integración Supabase en el sitio

- Cliente `@supabase/supabase-js` con URL y anon key via variables de entorno.
- Auth de Supabase para el login futuro de alumnos.
- Vistas de cursos se pueden armar estáticas o leer de Supabase según necesidad.

### Fase 6 - Corte

- Backup final del WP viejo.
- En Donweb, apuntar el dominio a `public_html/tmyh-web/` (o mover el contenido a `public_html/` renombrando el WP viejo).
- Verificar redirecciones 301 para URLs viejas importantes.

## Decisiones tomadas

- Ferozo no empuja a GitHub. Solo hace pull. Por eso el backup del WP se sube a GitHub desde la PC local.
- El sitio nuevo vive en una subcarpeta durante el desarrollo para no tocar el WP actual.
- `database.sql` queda fuera de Git por seguridad.
