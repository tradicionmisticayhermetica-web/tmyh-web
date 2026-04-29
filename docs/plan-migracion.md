# Plan de migración TM&H — completado

Este documento queda como referencia histórica del plan que se ejecutó
para migrar el sitio de WordPress a Astro + Supabase. Todas las fases
listadas acá ya están terminadas. Para el estado actual y los próximos
pasos ver `docs/PENDIENTES.md`. Para entender la infraestructura
operativa hoy ver `docs/arquitectura.md`.

## Origen y destino

El sitio histórico vivía en WordPress hospedado en Donweb/Ferozo, en
el dominio `tradicionmisticayhermetica.com`. Tenía Ultimate Member para
gestión de usuarios, Sensei LMS para cursos, BlossomThemes Newsletter
para suscripciones, WordFence como plugin de seguridad, y un tema
basado en alguno de la familia Blossom.

El destino fue una stack moderna: el frontend en Astro 5 con TypeScript
y Tailwind CSS 4, la base de datos y autenticación en Supabase
(Postgres gestionado), el envío de email en Resend con dominio propio
verificado, y el hosting en el mismo Donweb/Ferozo pero ahora sirviendo
solo archivos estáticos (sin PHP corriendo).

## Decisiones de diseño tomadas en el camino

Sobre dónde vive cada cosa: el sitio nuevo es estático y se sirve desde
Ferozo, pero la base de datos vive en la nube de Supabase. Esto significa
que si en el futuro se cambia de hosting, los datos no se mueven (siguen
en Supabase) y solo hay que apuntar el deploy a otro servidor. Es una
decisión de portabilidad importante.

Sobre seguridad de claves: la `service_role` de Supabase nunca toca el
frontend (vive solo en edge functions y scripts admin), la `anon key`
sí va al frontend pero está limitada por RLS. La SSH key de Ferozo
nunca sale del servidor. Las claves locales de la PC tampoco salen
del disco.

Sobre control de versiones: se mantuvieron dos repos en GitHub bajo la
cuenta `tradicionmisticayhermetica-web`: uno para el WordPress viejo
(`tmyh-wp-legacy`, archivado) y otro activo para el sitio nuevo
(`tmyh-web`).

## Fases ejecutadas

### Fase 1 — Backup del WordPress viejo

Se exportó el sitio entero con All-in-One WP Migration generando un
archivo `.wpress` de 293 MB. También se hizo un export XML del
contenido (posts, páginas) y se descomprimió el `.wpress` a la
carpeta `wp-extracted/`. Se creó el repo `tmyh-wp-legacy` en GitHub
para conservar tema, plugins y uploads como referencia histórica.
La base de datos no se subió al repo por contener emails y hashes;
quedó en disco local cifrada.

### Fase 2 — Esquema de base de datos en Supabase

Se creó el proyecto Supabase y las tablas `contactos` (directorio
unificado de personas, una fila por email único) e `inscripciones`
(vínculo contacto-curso con trazabilidad de fuente). Se activó RLS
con la decisión inicial de no crear policies abiertas; solo el
`service_role` accedía al principio. Las policies para admins se
agregaron después en sucesivas migraciones.

### Fase 3 — Importación de usuarios

De Google Classroom: se exportó por cada una de las 7 cuentas Gmail
con un script de Apps Script (documentado en `docs/classroom-export.md`)
que usa la API de Classroom. Cada cuenta produjo su CSV; los CSVs se
unificaron con `scripts/merge_classroom_csvs.py`. De WordPress:
exportación de `wp_users` y `wp_usermeta` desde la BD vieja, normalización
en `scripts/wp_users_to_csv.py`. Se subió todo a Supabase con
`scripts/upload_contactos_to_supabase.py` con upsert por email
(case-insensitive) y deduplicación. Total final: 1262 contactos únicos
en `public.contactos`.

### Fase 4 — Sitio nuevo en Astro

Se desarrolló localmente el sitio con páginas para Home, Cursos
(listado y detalle de cada uno), La Tradición (originalmente
"Sobre mí", renombrada por decisión editorial), Contacto, Blog (con
posts hardcodeados de prueba), Newsletter (preferencias y baja),
Login y Panel admin. Tipografía Cinzel + Cormorant Garamond + Inter,
paleta noche/oro/pergamino, animaciones sutiles tipo "respiración"
en avisos y elementos de atención.

### Fase 5 — Integración con Supabase

El sitio se conecta a Supabase desde el navegador del visitante usando
`@supabase/supabase-js`. El formulario de contacto inserta en
`public.mensajes_contacto`. El login del panel usa Supabase Auth con
sesión persistente. Las migraciones SQL se aplicaron en orden:

- 001: soporte newsletter (columnas en contactos para opt-in)
- 002: tabla `mensajes_contacto` y vistas de explotación
- 003: mejora de grupos
- 004: lifecycle del newsletter (token de baja, eventos)
- 005: panel admin (perfiles, roles, RLS para mensajes)
- 006-007: descartadas (eran parte del intento de panel con thread
  de respuestas, después se simplificó)
- 008: simplificación tras descartar el panel de respuestas
- 009: RLS admin para contactos e inscripciones

### Fase 6 — Deploy y cutover

Se armó el flujo de dos ramas: `main` con código fuente, `production`
con el build compilado. Se configuró Ferozo en el módulo GIT con la
SSH key del servidor pegada en la cuenta GitHub de Tradición. Se
generó una segunda SSH key en la PC local para que el desarrollador
pueda pushear. Se armó el script `deploy.ps1` que automatiza build y
push a `production`.

Para el cutover: se respaldó WordPress (con el `.wpress` que ya
existía), se eliminó el repo git viejo de Ferozo, se vació
`public_html/` por completo, y se creó un nuevo repo git en Ferozo
apuntando a la rama `production` con destino `public_html/` directo.
Sincronización inicial: éxito. El sitio nuevo quedó accesible en
`https://www.tradicionmisticayhermetica.com/` desde la raíz, sin
prefijo de subcarpeta.

WordPress quedó oficialmente jubilado.
