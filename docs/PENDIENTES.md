# Pendientes y roadmap

Lista corta de lo que viene, en orden de prioridad. Para entender la
infraestructura actual ver `docs/arquitectura.md`.

## Próxima sesión — Backoffice editorial (blog + newsletter)

Es el bloque grande siguiente y unifica dos cosas que naturalmente van
juntas: que Emanuel pueda **publicar contenido en el sitio** sin tocar
código, y que pueda **enviar newsletters** a los 1262 suscriptores.

### Visión

Hoy el blog del sitio está vacío (solo hay 3 posts hardcodeados de
prueba). La idea es que en `/area-reservada` haya una sección "Blog" o
"Editor" donde Emanuel pueda crear posteos con un editor rico:
formato de texto (negritas, itálicas, citas), encabezados, listas,
inserción de imágenes (subiéndolas desde la PC), embeds (videos,
links a YouTube), separadores ornamentales. El estilo visual del editor
debería respetar la tipografía y paleta del sitio (Cinzel + Cormorant
Garamond + paleta oro/pergamino) para que lo que ve mientras escribe
sea similar a cómo se va a ver publicado.

Cada posteo se guarda en una tabla nueva (`posts` o `articulos`) en
Supabase, con campos como `titulo`, `slug`, `extracto`, `contenido_json`
(la representación estructurada del editor), `contenido_html` (el HTML
renderizado para servir), `imagen_destacada`, `publicado_en`, `autor`,
`estado` (borrador, publicado, archivado), `etiquetas`, etc.

El sitio público lee de esa tabla y arma `/blog` listando los posts
publicados ordenados por fecha descendente (lo más nuevo arriba).
Cada post tiene su URL `/blog/[slug]`. El render se puede hacer:
estático (pre-rendering en cada deploy con un `getStaticPaths` que
lee de Supabase) o dinámico (Astro endpoint que consulta en cada
request). Estático es más rápido y barato; dinámico permite ver los
cambios sin redeployar. Para el caso de Emanuel publicando 1-2 posts
por semana, estático con un trigger de re-deploy automático tiene más
sentido.

El newsletter reusa toda esta infra. Cada vez que se publica un post,
Emanuel decide si lo manda como newsletter a los suscriptores. Si sí,
una edge function (`enviar-newsletter` o similar) toma el `contenido_html`
del post, le aplica una plantilla de email, le agrega header con el
sello solar y footer con link de baja, y lo manda en lotes con
Resend Batch API a los 1262 emails. Para mandar 1262 mails en un día
hay que pasar a Resend Pro (el Free permite 100/día). O dejar el envío
distribuido a lo largo de 13 días, lo que es feo.

### Tareas concretas a hacer

1. Migración SQL para crear `posts` (o `articulos`) con todas las
   columnas mencionadas. Con RLS: lectura pública para `estado =
   'publicado'`, escritura solo para admins.
2. Página `/blog` que liste posts (consulta a Supabase desde el
   build estático, vía `getStaticPaths`).
3. Página `/blog/[slug]` que renderice un post.
4. Editor en `/area-reservada/blog/nuevo` y `/area-reservada/blog/[id]`
   que use una librería tipo Tiptap, ProseMirror, Lexical o similar.
   La librería debe permitir: negritas/cursivas/títulos, imágenes con
   upload a Supabase Storage, embeds de YouTube/Vimeo, y bloques de
   cita ornamentales.
5. Edge function `enviar-newsletter` que tome un post publicado y lo
   mande por Resend Batch API a los `contactos` con `newsletter_optin = true`.
6. Página pública `/baja?token=...` para que un suscriptor pueda darse
   de baja con un click. La columna `newsletter_token_unsubscribe` ya
   existe en `contactos` (mig 004).
7. Rebuild automático: cuando se publica un post, idealmente se dispara
   el deploy. Como hoy el deploy es manual, evaluar si vale la pena
   armar una GitHub Action que se dispare con un webhook de Supabase
   cuando hay cambios en `posts`, o si dejamos el deploy manual y le
   avisamos a Emanuel "después de publicar, avisame y deployo".

### Decisiones a tomar al arrancar

- **Editor**: Tiptap es la opción más popular para este caso de uso.
  Es liviano, basado en ProseMirror, con plugins para imágenes y
  embeds. Alternativa: Lexical (de Meta), también bueno pero más
  pesado. Para el setup que tenemos, Tiptap es suficiente.
- **Storage de imágenes**: Supabase Storage tiene un bucket público
  donde se pueden subir las imágenes del blog. Cada post puede tener
  una imagen destacada y N imágenes en el cuerpo.
- **Render**: estático (pre-render en build) vs dinámico (server-side).
  Recomiendo estático con re-deploy manual o webhook, mejor performance
  y SEO.
- **Resend Pro**: hablarlo con Emanuel cuando llegue el momento del
  newsletter. 20 USD/mes, 50.000 mails/mes, sin límite diario.

## Pendientes menores que siempre quedan

Cuando Emanuel mande material:

- Foto de Emanuel para `/tradicion` (hoy hay solo cita de Guénon y
  texto).
- Link de MercadoPago del Curso Introductorio a la Simbología Hermética
  ($210.000). Hoy ese curso muestra el botón de MP bloqueado porque
  falta el `linkMercadoPago` en `cursos.ts`.

## Fases futuras (orden estimado)

### Fase 3 — LMS básico

Tablas `cursos`, `lecciones`, `inscripciones`, `progreso` en Supabase.
Páginas `/cursos/[slug]/lecciones/[slug]` protegidas por inscripción.
Roles `alumno` y `docente` ya existen en `perfiles`. La login y la
gestión de roles ya está montada (mig 005), así que esta fase reusa
mucho de lo existente.

### Fase 4 — Video hosting protegido

Cloudflare Stream o Bunny Stream con signed URLs. Reproductor custom
que verifique la inscripción contra Supabase antes de pedir la URL
firmada al servicio de video. Las URLs firmadas tienen TTL corto
(5-15 min) para que no se puedan compartir o descargar. Esto resuelve
el problema histórico de los videos en YouTube que se les robaban.

### Fase 5 — Pagos automatizados

MercadoPago Checkout Pro con webhook que auto-inscribe al alumno tras
pago confirmado. PayPal opcional para extranjeros. Hasta entonces, los
pagos se gestionan manualmente: el alumno paga, manda comprobante por
email, Emanuel le da acceso a mano.

### Fase 6 — Optimización SEO post-cutover

Cuando WordPress estaba vivo, Google indexó URLs con su estructura
(`/category/...`, `/2024/01/post-name`, etc.). Esas URLs hoy dan 404
porque la estructura del sitio nuevo es distinta. Para preservar SEO
se puede armar un `.htaccess` con redirects 301 que mapee las URLs
viejas más importantes a las equivalentes del sitio nuevo, o bien
redirigir todo lo no encontrado a la home. Si Google no indexó muchas
URLs específicas (sitio chico, posts contados), no es prioritario; si
el tráfico orgánico cae notablemente, se hace.

## Decisiones cerradas (referencia rápida)

- ✅ El sitio captura consultas en `mensajes_contacto`.
- ✅ La conversación de cada consulta se gestiona desde Gmail
  (la notificación tiene `Reply-To: <email del visitante>`).
- ✅ El panel `/area-reservada` es archivo histórico read-only
  (más base para el editor de blog/newsletter futuro).
- ✅ Login + perfiles + roles funcionando.
- ✅ Cuenta `tradicionmisticayhermetica-web` en GitHub firma todos
  los commits del repo (separación de identidad personal/proyecto).
- ✅ Cutover hecho: WordPress jubilado, sitio nuevo en producción
  servido desde la raíz del dominio.
- ❌ Descartado: Resend Inbound webhook para capturar respuestas
  entrantes en el panel (sobre-ingeniería, Gmail gestiona perfecto).
- ❌ Descartado: panel con thread completo de respuestas (mismo
  argumento).
- ❌ Descartado: IMAP polling sobre Donweb (riesgo de credenciales
  sin ROI claro).

## Hecho hasta hoy (cronológico)

- ✅ Fase 1: backup de WordPress viejo, repo `tmyh-wp-legacy` en GitHub.
- ✅ Fase 2: tablas `contactos`, `inscripciones` en Supabase con migración
  y normalización.
- ✅ Fase 3: importación de los 1262 contactos legacy desde Classroom y
  WordPress, todos con `newsletter_optin = true`.
- ✅ Fase 4: sitio nuevo Astro completo con páginas Home, Cursos,
  La Tradición, Contacto, Blog (con posts hardcodeados de prueba),
  Login, Panel admin, recuperación de contraseña.
- ✅ Migración SQL 005 (auth, perfiles, roles).
- ✅ Migración SQL 008 (limpieza tras descartar el panel de respuestas).
- ✅ Migración SQL 009 (RLS de admin para contactos e inscripciones,
  para que el panel pueda contar suscriptores).
- ✅ Edge Function `notificar-mensaje-contacto` con Reply-To al visitante.
- ✅ Email transaccional via Resend con dominio
  `tradicionmisticayhermetica.com` verificado.
- ✅ Repo `tmyh-web` en GitHub bajo la organización
  `tradicionmisticayhermetica-web`, ramas `main` y `production`.
- ✅ SSH keys configuradas: una en Ferozo (para `git pull` desde el
  hosting) y otra en la PC local (para `git push`).
- ✅ Script `deploy.ps1` que automatiza build + push a `production`.
- ✅ Cutover completo: WordPress eliminado de `public_html/`, sitio
  nuevo servido desde la raíz del dominio.
