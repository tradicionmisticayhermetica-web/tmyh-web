# Pendientes y roadmap

Infraestructura: `docs/arquitectura.md`.

---

## Orden de trabajo (visión general)

1. **SEO** — técnico + migración de URLs + metadatos compartibles; base para que Google entienda el sitio y no se pierda el tráfico viejo.
2. **Newsletter** — después del bloque SEO razonablemente listo (Resend + panel + bajas).
3. **Contenido pendiente** — foto `/tradicion`, link MercadoPago del curso intro (cuando manden datos).
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
- [ ] **Search Console** (si no está): dar de alta la propiedad `tradicionmisticayhermetica.com`, enviar sitemap, revisar cobertura y URLs con errores.
- [ ] **Revisión rápida**: `h1` único por página, listado del blog con textos de enlace claros, `alt` en imágenes del contenido Tiptap cuando falte.
- [ ] **Opcional**: JSON-LD `BlogPosting` en posts publicados.
- [ ] **Seguimiento**: tras 2–4 semanas, revisar Search Console (impresiones, clics, nuevas páginas indexadas) y ajustar títulos/extractos donde haga falta.

---

## 2. Newsletter (después de SEO)

- [ ] Migración SQL: campañas / cola de envíos (diseño a cerrar).
- [ ] Pantalla **Newsletter** en `/area-reservada` (activar ítem del menú): editor, asunto, vista previa, segmento.
- [ ] Edge Function de envío: Resend en **lotes** (plan free) u **horizonte Pro** si acuerdan costo.
- [ ] Flujo de baja con token alineado a `contactos` y página pública usable.
- [ ] Plantilla de email acorde al sitio (cabecera, pie, link al blog).

**Decisión:** Resend Free (~100 correos/día) vs Pro (~20 USD/mes) antes de armar cron/cola.

---

## 3. Pendientes menores (contenido / producto)

- [ ] Foto para `/tradicion`.
- [ ] `linkMercadoPago` del Curso Introductorio Simbología Hermética en `cursos.ts`.

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

## Fases futuras (orden estimado)

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
