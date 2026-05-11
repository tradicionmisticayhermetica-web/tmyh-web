# Pendientes y roadmap

Infraestructura: `docs/arquitectura.md`.

---

## Orden de trabajo (visión general)

1. ~~**SEO**~~ — código completo, quedan tareas manuales (inventario de URLs viejas + seguimiento Search Console).
2. ~~**Cursos (backoffice)**~~ — terminado, autogestión completa con papelera, estados, deploy automático.
3. **Newsletter** — *en curso (mayo 2026)*. Bloques 1 (BD), 2 (UI admin + preview + envío de prueba), 3 (worker Resend) y 4 (cron horario) listos. Quedan webhook de eventos Resend (Bloque 5) y analíticas (Bloque 6).
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

**Configuración de capacidad — plan Free actual** (mayo 2026):

| Parámetro | Valor actual | Dónde se cambia |
|-----------|--------------|-----------------|
| Cuota diaria | **95 mails/día** (margen sobre 100 del Free) | Edge Functions → Secrets → `NEWSLETTER_DAILY_LIMIT` |
| Batch por corrida | **12 mails/tick** | Edge Functions → Secrets → `NEWSLETTER_BATCH_SIZE` |
| Schedule del cron | **`5 0,12-23 * * *`** (13 ticks/día, en horario humano ARG 09–21) | `cron.alter_job(..., schedule := '...')` en SQL Editor |
| Estimación UI (modal de encolar) | **95** | `tmyh-web/src/lib/newsletter-cms.ts` → `NEWSLETTER_LIMITE_DIARIO_INFO` |

**Si en el futuro pasamos al plan Resend paid** (ej: Pro con 50.000 mails/mes ≈ 1666/día), hay que cambiar **los 4 lugares** de la tabla. Sugerencia para ese plan:
- `NEWSLETTER_DAILY_LIMIT = 1500` (margen sobre 1666).
- `NEWSLETTER_BATCH_SIZE = 25` (más alto porque hay más cuota).
- Schedule cron `*/10 12-23,0 * * *` (cada 10 min en horario humano ARG = 78 ticks/día × 25 = 1950 cap a 1500).
- `NEWSLETTER_LIMITE_DIARIO_INFO = 1500` para que el modal muestre la estimación correcta.

Con esos valores, una campaña de 1265 destinatarios (la base actual) se manda en **1 día** en lugar de 14.

### Bloques de implementación

- [x] **Bloque 1 — BD** (`017_newsletter_campanas.sql`): tablas `newsletter_campanas`, `newsletter_campana_posts` (junction con orden), `newsletter_envios` (1 fila por campaña × suscriptor) + RLS admin + RPCs (`encolar`, `pausar`, `reanudar`, `cancelar`, `proximo_lote`, `marcar_enviado`, `marcar_fallido`) + trigger de auto-baja en bounce/complaint.
- [x] **Bloque 2 — UI admin** `/area-reservada/newsletter`: listado con KPI de suscriptores activos, filtros por estado y buscador (`index.astro`); editor con asunto + intro TipTap (reusa `EditorBlog.astro`) + multi-select de posts publicados con drag para reordenar (`editar.astro`); vista de envíos con filtros y errores legibles (`envios.astro`); **vista previa** del email en iframe con modo desktop/mobile (`preview.astro`); **envío de prueba** a un email puntual sin tocar la lista (botón en el editor + edge function `enviar-newsletter-prueba`); botones Encolar / Pausar / Reanudar / Cancelar / Eliminar según estado, con modal de confirmación. Render del email reutilizable (`lib/newsletter-render.ts` + `supabase/functions/_shared/newsletter-render.ts`). Item "Newsletter" habilitado en el sidebar.
- [x] **Bloque 3 — Edge Function `procesar-newsletter-cola`**: pide lotes a `newsletter_proximo_lote(N)`, valida `newsletter_optin` actual antes de mandar (defensa contra desuscripciones entre encolada y envío), arma el HTML con el render compartido, lo dispara con Resend (con headers `List-Unsubscribe` 1-click para mejor entregabilidad en Gmail/Outlook) y reporta resultados con `marcar_enviado` / `marcar_fallido`. Cuota diaria configurable por env (`NEWSLETTER_DAILY_LIMIT=95` default) y batch por corrida (`NEWSLETTER_BATCH_SIZE=12` default). Detecta bounces duros vs errores transitorios para que el trigger de auto-baja solo se dispare cuando corresponde. Acepta service_role (cron) y JWT admin (botón "Procesar lote ahora" en el editor).
- [x] **Bloque 4 — Cron** (`018_newsletter_cron.sql` + `019_es_admin_service_role.sql`): job `newsletter-procesar-cola` en `pg_cron` programado en horario humano ARG (cron `5 0,12-23 * * *`, 13 ticks/día); invoca la edge function vía `pg_net.http_post` con el `service_role` JWT inline en el comando. Incluye helpers SQL `newsletter_envios_hoy()` (cuota diaria en zona Argentina) y `newsletter_rescatar_envios_trabados(p_minutos)` (defensa contra workers caídos). La 019 parchea `public.es_admin()` para que reconozca `auth.role() = 'service_role'`, así las RPCs admin aceptan llamadas del worker. La URL del proyecto y el `service_role` JWT del header del archivo 018 se reemplazan inline antes de aplicar (no se commitean al repo). Verificado end-to-end con `pg_net.http_post` manual — devuelve `{ok:true, skipped:'sin_pendientes'}` cuando no hay campañas encoladas.
- [x] **Bloque 5 — Webhook Resend** (`020_newsletter_eventos_resend.sql` + edge function `resend-eventos`): endpoint público que recibe `email.delivered`, `email.opened`, `email.bounced`, `email.complained` y actualiza el envío correspondiente vía `resend_id`. Verifica firma HMAC SHA-256 (formato Svix, que es lo que usa Resend) con `RESEND_WEBHOOK_SECRET`. La RPC `newsletter_registrar_evento_resend` es idempotente para eventos terminales (delivered/bounced/complained) y suma al contador `aperturas` cada vez que llega `opened`. El bounce/complaint inserta una fila en `newsletter_eventos` que dispara el trigger ya existente que pasa el contacto a `optin = false` automáticamente. Listado de envíos ahora muestra badges de Entregado / Abierto ×N / Spam, y el listado de campañas muestra `% abiertos` cuando hay datos. Pendiente del usuario: configurar el webhook en Resend Dashboard (URL `https://<proyecto>.supabase.co/functions/v1/resend-eventos`, eventos `email.delivered`/`email.opened`/`email.bounced`/`email.complained`) y guardar el signing secret como `RESEND_WEBHOOK_SECRET` en Edge Functions Secrets.
- [x] **Caja de suscripción pública** (`021_newsletter_subscribir_email.sql` + componentes `NewsletterFooterCTA.astro` y `RedesSociales.astro`): RPC pública `newsletter_suscribir_email` con rate-limit (3/24h por email, 10/h por IP) que crea contacto nuevo o resuscribe uno existente. Caja en el footer de todas las páginas (input de email + botón) con feedback claro (mensaje de bienvenida, errores humanos por código, idempotente para emails ya suscriptos). El componente reemplaza al form por un mensaje exitoso al completar. Origen del evento se guarda en `newsletter_eventos.origen` (ej: `web:footer`) para poder medir qué canal capta más.
- [x] **Redes sociales unificadas** (`src/data/redes.ts` + `RedesSociales.astro`): fuente única de verdad para los URLs de Instagram/Facebook/WhatsApp y el número (`5491165008996`). Componente reusable con dos variantes: `footer` (íconos chicos en línea) y `contacto` (botones grandes con label). Footer ahora muestra los 3 íconos junto al email; `/contacto` los muestra prominentes arriba del formulario con copy *"Para una consulta detallada o sobre cursos, mandanos el formulario"* (evita canibalizar el form). `/tradicion` mantiene el IG personal de Emanuel (`emanuelmari79`) ya que ahí se habla específicamente del fundador.
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

### Analytics

- **Google Analytics 4** integrado vía componente `GoogleAnalytics.astro`
  (incluido tanto en `BaseLayout` como en `AdminLayout` — se trackea el
  sitio completo, incluyendo admin).
- ID se inyecta en build vía secret `PUBLIC_GA_ID` en GitHub Actions.
  Si la variable no está seteada (ej. `npm run dev`), el componente no
  renderiza nada y GA queda inactivo.
- `anonymize_ip: true` configurado por defecto.
- Eventos automáticos de GA4 (Enhanced Measurement, default ON en el
  stream): page views, scroll depth (90%), outbound clicks, file
  downloads, video engagement.
- Banner de cookies **informativo** (no consent gate) al pie de las
  páginas públicas — componente `CookieBanner.astro`. Se cierra con un
  click y guarda preferencia en `localStorage`.

### Stack — versiones fijadas

- **Node**: 22 LTS en CI (`.github/workflows/deploy.yml`). Algunos paquetes
  del lock requieren `>=22.12.0`. Local: 22 o 24 funcionan; usamos LTS en
  CI por estabilidad.
- **Astro 5.18.1** (no 6.x). Astro 6 trae Vite 7 y `@tailwindcss/vite` 4.2.x
  trae Vite 8 (rolldown-vite preview): el conflicto de versiones internas
  rompe la build. Subir a Astro 6 cuando Tailwind/plugins se alineen.
  - Hay una XSS *moderate* en Astro <6.1.6 (`define:vars` con sanitizado
    incompleto de `</script>`). En este sitio `define:vars` solo se usa en
    `AdminLayout.astro` con un literal definido por el dev (`active`),
    nunca con datos de usuario ni de DB → **no aplicable**.
- **Tailwind 4.2.4** (`tailwindcss` y `@tailwindcss/vite`).

---

## Hecho hasta hoy (resumen)

- Datos: contactos, inscripciones, import, RLS admin.
- Sitio Astro, contacto, Resend, área reservada, deploy Ferozo.
- Blog completo en producción; página La Tradición; avisos de pago en cursos.
