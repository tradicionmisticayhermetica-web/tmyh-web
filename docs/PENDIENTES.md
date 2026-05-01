# Pendientes y roadmap

Infraestructura: `docs/arquitectura.md`.

---

## Orden de trabajo (visión general)

1. ~~**SEO**~~ — código completo, quedan tareas manuales (inventario de URLs viejas + seguimiento Search Console).
2. ~~**Cursos (backoffice)**~~ — terminado, autogestión completa con papelera, estados, deploy automático.
3. **Newsletter** — *en curso (mayo 2026)*. Bloque 1 (BD) listo. Quedan 5 bloques más (UI, worker Resend, cron, webhook eventos, analíticas).
4. **LMS / video / pagos** — fases grandes más adelante (ver abajo).

---

## 1. SEO (prioridad actual)

### Sobre “salir primero en las búsquedas”

Nadie puede garantizar el **primer resultado**: Google ordena por relevancia, competencia, intención de búsqueda, historial del dominio y cientos de señales. Lo que sí hace este plan es:

- Dejar el sitio **bien rastreable e indexable** (sin errores tontos).
- **Recuperar** visitas que aún entran por URLs del WordPress (301).
- Mejorar **cómo se muestra** el sitio cuando comparten un link (Open Graph).
- **Fundación** para crecer: buen contenido en el blog + títulos/fragmentos pensados para búsquedas del nicho (hermetismo, cursos, simbología, etc.).

El despegue fuerte suele venir del **contenido útil y estable** en el tiempo, más que de trucos técnicos.

### Qué tenemos pensado (enfoque)

- **Técnico**: una sola URL canónica por página, sitemap actualizado, redirects 301 desde rutas WordPress importantes, meta `title` / `description` coherentes, buena jerarquía de encabezados (`h1`–`h3`), imágenes con `alt` útil.
- **Blog / artículos**: título + descripción (extracto) alineados con lo que la gente busca; Open Graph (y Twitter Card) por post cuando hay datos; opcional JSON-LD `Article` para rich results.
- **Migración**: inventario de URLs con tráfico (Search Console o lista manual) → reglas en `.htaccess` (o equivalente en Ferozo) hacia `/blog/post?slug=...`, `/cursos/...`, `/tradicion`, etc.
- **Contenido (continuo)**: publicar con constancia, enlaces internos entre reflexiones y cursos, evitar páginas “finas”; el newsletter después ayuda a traer tráfico directo, no reemplaza al SEO orgánico.

### Tareas SEO (orden sugerido)

- [ ] **Search Console** (si no está): dar de alta la propiedad `tradicionmisticayhermetica.com`, enviar sitemap, revisar cobertura y URLs con errores.
- [ ] **Inventario**: listar URLs del WordPress que aún reciban clics o estén indexadas (export “Páginas con tráfico” o lista manual priorizada).
- [x] **Redirects 301** en hosting: archivo `public/.htaccess` con plantilla de reglas (HTTPS, posts WP año/mes/día → `/blog/post?slug=...`, categorías/tags → `/blog`, feeds, etc.). Falta completar mapeos específicos cuando esté el inventario.
- [x] **Meta por página estática**: `title` y `description` repasados en home, cursos, tradición, contacto, blog índice, 404 (este último estaba con encoding corrupto, se reescribió).
- [x] **Post del blog (detalle)**: al cargar el artículo en el navegador se actualizan `title`, `meta description` (extracto o primer texto del cuerpo), **Open Graph**, **Twitter Cards**, **`link rel=canonical`** y **JSON-LD** `BlogPosting` (sin cambiar el diseño de la página). Nota: los meta “finos” existen tras ejecutar JS; la mayoría de bots modernos lo procesan.
- [x] **Revisión rápida**: `h1` único por página verificado, `alt` presentes en imágenes principales (home, tradición, cursos, posts).
- [x] **JSON-LD global**: `Organization` + `WebSite` inyectados en `BaseLayout` (aparecen en todas las páginas públicas).
- [x] **JSON-LD `Course`**: emitido en `/cursos/[slug]` para cursos en estado `activo` o `proximo`.
- [x] **Sitemap filtrado**: solo URLs públicas reales (excluye `/area-reservada/*`, `/login`, `/recuperar-password`, `/restablecer-password`, `/newsletter/*` y `/blog/post/` sin slug).
- [x] **`robots.txt` reforzado**: `Disallow` explícitos para áreas privadas y links únicos por usuario.
- [ ] **Seguimiento**: tras 2–4 semanas, revisar Search Console (impresiones, clics, nuevas páginas indexadas) y ajustar títulos/extractos donde haga falta.

---

## Hecho — backoffice cursos (referencia)

| Ítem | Estado |
|------|--------|
| SQL `cursos` + RLS, papelera, estados | ✅ `014`, `016` |
| Listado con filtros + buscador | ✅ |
| Editor completo (título, slug, precios, inscripción, imagen, símbolo, temario por módulos) | ✅ |
| Banco de símbolos con tooltips ordenado por categoría | ✅ |
| Estado `edicion_cerrada` + validación al publicar | ✅ |
| Mover a papelera / restaurar / eliminar definitivo + deploy automático | ✅ |
| Mensajes: papelera + restaurar + eliminar definitivo + buscador | ✅ |
| Loader global del sitio (☿ + 🜍 + 🜔 → ☉) con watchdog 15 s | ✅ |
| Despliegue inmediato Ferozo via GitHub webhook (sin SSH) | ✅ |

---

## 2. Newsletter (en curso)

Objetivo: **autonomía** de Emanuel para armar envíos sin depender de terceros, con visibilidad de estado y analíticas suficientes para decidir.

**Decisiones cerradas (1/may):**
- Plan Resend: **Free** (~100 mails/día). El worker está pensado para repartir cualquier campaña en varios días si supera el límite.
- Remitente único: `contacto@tradicionmisticayhermetica.com`.
- Cuerpo del newsletter: introducción rica en TipTap (igual que blog) + selección de **posts existentes del blog** (1+) que se insertan en el email con el mismo look & feel del sitio.
- Reintentos: **0** automáticos. Si un envío falla, queda visible con su `error_codigo` / `error_mensaje` para que el admin decida.
- Auto-baja: si Resend reporta `bounced` o `complained`, el contacto pasa solo a `newsletter_optin = false` (trigger en BD).

### Bloques de implementación

- [x] **Bloque 1 — BD** (`017_newsletter_campanas.sql`): tablas `newsletter_campanas`, `newsletter_campana_posts` (junction con orden), `newsletter_envios` (1 fila por campaña × suscriptor) + RLS admin + RPCs (`encolar`, `pausar`, `reanudar`, `cancelar`, `proximo_lote`, `marcar_enviado`, `marcar_fallido`) + trigger de auto-baja en bounce/complaint.
- [x] **Bloque 2 — UI admin** `/area-reservada/newsletter`: listado con KPI de suscriptores activos, filtros por estado y buscador (`index.astro`); editor con asunto + intro TipTap (reusa `EditorBlog.astro`) + multi-select de posts publicados con drag para reordenar (`editar.astro`); vista de envíos con filtros y errores legibles (`envios.astro`); botones Encolar / Pausar / Reanudar / Cancelar / Eliminar según estado, con modal de confirmación. Item "Newsletter" habilitado en el sidebar.
- [ ] **Bloque 3 — Edge Function `procesar-newsletter-cola`**: llama `newsletter_proximo_lote(N)`, arma el HTML de cada email (intro + posts seleccionados con plantilla del sitio), lo manda con Resend, reporta con `marcar_enviado` / `marcar_fallido`. Incluye rate-limit interno para no pasar de N mails/día.
- [ ] **Bloque 4 — Cron**: `pg_cron` (o trigger programado) que invoca la edge function cada hora.
- [ ] **Bloque 5 — Webhook Resend** (`resend-eventos`): endpoint que recibe `email.delivered`, `email.opened`, `email.bounced`, `email.complained` y actualiza el envío correspondiente vía `resend_id`. El bounce/complaint registra evento → trigger ya existente desuscribe automáticamente.
- [ ] **Bloque 6 — Analíticas**: torta (enviados/pendientes/fallidos/rebotados/bajas), barras (comparativa últimas N campañas), tendencia con regresión lineal (TS puro, sin librería pesada).
- [ ] **Plantilla email** consistente con el sitio (header gold + serif + footer con link a `/newsletter/preferencias?token=…`). Se arma en el Bloque 3.

---

## 3. Cursos — backoffice (autogestión)

Objetivo: mismo **espíritu que el módulo Blog** (listado con cards, filtros por estado, edición rica), pero el contenido refleja la **ficha de curso** del sitio público: Emanuel arma cursos sin tocar `cursos.ts` a mano.

### Modelo de producto (referencia UI)

- Tomar como **modelo visual** las **cards del listado de blog** (título, badge de estado, slug/ruta, extracto, fecha).
- **Contenido interno** inspirado en las páginas ya publicadas: **Heka** como referencia preferida de estructura (módulos con subtemas); **Simbología** / Espagiria como variantes (temario plano vs módulos anidados — el editor debe permitir **ambos estilos** o normalizar a “módulos” donde un módulo puede tener lista simple de strings).
- Campos **predefinidos en la ficha** (como en producción): título, subtítulo, slug, descripciones corta/larga, modalidad, **precios** (ARS / USD / notas), fechas de inicio, símbolo, imagen/afiche, estado del curso (**borrador / activo / histórico / archivado** — a definir enum), enlace MercadoPago cuando exista, WhatsApp, datos de inscripción comunes si se centralizan en BD.

### Funcionalidad

- [ ] **Listado** `/area-reservada/cursos` con pestañas o filtros (todos / borradores / activos / archivados) y acciones: nuevo, editar, **ir a vista pública** (preview o URL).
- [ ] **Editor de temario**: árbol o lista ordenable de **módulos** → cada uno: título + ítems (descripciones o bullets); soportar el caso “plan tipo Simbología” (lista plana de strings) como un solo módulo implícito o plantilla.
- [ ] **Estados y precios** editables; validaciones mínimas (slug único, precio texto obligatorio si está “activo”, etc.).
- [ ] **Migración SQL** `cursos` (o nombre acordado) + RLS admin; decidir si la **página pública** lee solo de Supabase o híbrido con build (SSR/CSR en Astro para `/cursos/[slug]`).

### Stack sugerido

| Pieza | Propuesta |
|-------|-----------|
| Datos | **Postgres** con JSONB para `temario` (módulos + items) o tablas normalizadas `curso_modulos` / `curso_modulo_items` si se prioriza reporting. |
| Admin UI | Mismo patrón que blog: páginas Astro en `area-reservada`, JS para drag-and-drop opcional (**SortableJS** liviano) o botones arriba/abajo al inicio. |
| Público | Sustituir o **generar desde BD** lo que hoy está en `src/data/cursos.ts` (migración gradual: flag “fuente BD” por slug). |
| Imágenes | Reutilizar patrón **Storage** + políticas admin (como blog) para afiches; URLs en tabla `cursos`. |

**Nota:** Esto es **autogestión de catálogo**, no LMS (lecciones, video, progreso siguen en “Fases futuras”).

---

## 4. Pendientes menores (contenido / producto)

- [x] Foto para `/tradicion` (**descartado por decisión de producto**).
- [x] `linkMercadoPago` del Curso Introductorio Simbología Hermética (**cerrado hasta nuevo aviso**).

---

## Hecho — backoffice blog (referencia)

| Ítem | Estado |
|------|--------|
| SQL `posts` + RLS, revisiones, papelera, slug parcial | ✅ `010`–`013` |
| `/blog` y `/blog/post?slug=…` desde Supabase | ✅ |
| Editor Tiptap + imágenes/vídeo/PDF/YouTube/tablas | ✅ |
| Storage `blog-images` + deploy al publicar | ✅ |
| Panel: nuevo, editar, papelera, vista previa, “Ir al sitio” | ✅ |

---

## Fases futuras (orden estimado; LMS y más)

- **LMS básico** — lecciones protegidas, progreso.
- **Video con URLs firmadas** — anti-link compartido fuera de contexto.
- **Pagos automatizados** — webhook post-pago.
- **SEO continuo** — contenido, enlaces internos, velocidad según métricas.

---

## Decisiones cerradas

- ✅ Mensajes: captura en BD; respuesta por Gmail.
- ✅ Blog editable desde el panel.
- ✅ GitHub + `production` + deploy al publicar post.
- ✅ Cutover a sitio nuevo en raíz.
- ❌ Hilo completo de email en el panel; IMAP en hosting.

---

## Hecho hasta hoy (resumen)

- Datos: contactos, inscripciones, import, RLS admin.
- Sitio Astro, contacto, Resend, área reservada, deploy Ferozo.
- Blog completo en producción; página La Tradición; avisos de pago en cursos.
