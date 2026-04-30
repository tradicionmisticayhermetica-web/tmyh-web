# Pendientes y roadmap

Infraestructura: `docs/arquitectura.md`.

---

## Orden de trabajo (visión general)

1. **SEO** — técnico + migración de URLs + metadatos compartibles; base para que Google entienda el sitio y no se pierda el tráfico viejo.
2. **Cursos (backoffice)** — autogestión de fichas de curso al estilo del blog, alineado a las páginas públicas actuales (Heka / Simbología).
3. **Newsletter** — dejar para el final: panel en área reservada, cola de envíos, métricas y análisis simples.
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
- [ ] **Redirects 301** en hosting: mapear rutas viejas → nuevas; probar 2–3 URLs críticas en navegador.
- [ ] **Meta por página estática**: repasar `title` y `description` en home, cursos, tradición, contacto, blog índice.
- [x] **Post del blog (detalle)**: al cargar el artículo en el navegador se actualizan `title`, `meta description` (extracto o primer texto del cuerpo), **Open Graph**, **Twitter Cards**, **`link rel=canonical`** y **JSON-LD** `BlogPosting` (sin cambiar el diseño de la página). Nota: los meta “finos” existen tras ejecutar JS; la mayoría de bots modernos lo procesan.
- [ ] **Revisión rápida**: `h1` único por página, listado del blog con textos de enlace claros, `alt` en imágenes del contenido Tiptap cuando falte.
- [ ] **Opcional**: JSON-LD `BlogPosting` en posts publicados.
- [ ] **Seguimiento**: tras 2–4 semanas, revisar Search Console (impresiones, clics, nuevas páginas indexadas) y ajustar títulos/extractos donde haga falta.

---

## 2. Newsletter (después de SEO)

Objetivo: **autonomía** de Emanuel para armar envíos sin depender de terceros, con visibilidad de estado y analíticas suficientes para decidir.

### Core (envío y datos)

- [ ] Migración SQL: **campañas**, **destinatarios por campaña** (estado: pendiente / enviado / fallido / baja), **eventos** (entregado, apertura si aplica), timestamps.
- [ ] Pantalla **Newsletter** en `/area-reservada` (sacar **PRONTO** del menú): editor de cuerpo (HTML o Markdown→HTML), asunto, vista previa, segmento (p. ej. sólo suscriptores activos en `contactos`).
- [ ] **Cola y lotes**: envío vía Resend por lotes (encaje con límite diario Free ~100/día o Pro); job que procese N mails por corrida.
- [ ] **Vista de campaña en curso o histórica**:
  - listado **a quién se envió** vs **quién sigue en pending**;
  - **progreso** (X de Y enviados);
  - **estimación de tiempo** restante si el envío está throttled (derivado de tamaño de cola, tamaño de lote y ventana permitida — mostrar texto tipo “~2 días a ritmo actual” con disclaimer).
- [ ] Flujo de **baja con token** ya alineado a `contactos` + página pública usable (revisar punta a punta).
- [ ] **Plantilla** de email acorde al sitio (cabecera, pie, link al blog, link preferencias/baja).

### Métricas y analíticas (panel)

- [ ] **Open rate** (y, si Resend lo expone sin fricción, clicks o tasas de rebote): definir fuente de verdad — webhooks Resend + tabla `newsletter_eventos` o análisis nativo de Resend con link desde el panel.
- [ ] **Gráficos simples** en el admin: **torta** (p. ej. enviados / pendientes / fallidos / bajas en campaña) y **barras** (campo a campo o comparar últimas N campañas).
- [ ] **Tendencia en el tiempo**: serie (aperturas, envíos por día o por campaña) + **regresión lineal** opcional como línea de tendencia (implementación liviana en TS: mínimos cuadrados sobre la serie visible; sin ML pesado).

### Stack sugerido (rápido, compatible con lo actual)

| Pieza | Propuesta |
|-------|-----------|
| Datos | **Supabase / Postgres** (tablas de campaña, envíos, eventos; RLS admin). |
| Envío | **Resend** API por lotes; **Edge Functions** + cron (`pg_cron` o invocación programada) para drenar cola. |
| Webhooks | Endpoint (Edge Function) para `delivered` / `opened` / `bounced` según documentación Resend → actualizar filas y rate. |
| Gráficos | **Chart.js** o **uPlot** desde vanilla TS (encaja con Astro sin montar React solo por esto); alternativa **Apache ECharts** si hace falta más tipos de chart. |
| Regresión | Función pura TS (pendiente ↔ tiempo o aperturas ↔ índice de campaña); sin dependencias pesadas. |

**Decisión previa al diseño fino:** Resend **Free** (~100 correos/día) vs **Pro** (~20 USD/mes) — condiciona tamaño de lote, necesidad de cola multi-día y si conviene delegar parte del reporting a Resend.

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
