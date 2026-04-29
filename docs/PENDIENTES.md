# Pendientes — sesiones futuras

Lista corta de lo que viene, en orden de prioridad.

---

## Próxima sesión

### 1. Aplicar migración 008 en Supabase

**ANTES DE PROBAR EL PANEL**: pegar
`docs/migrations/008_simplificar_a_captura.sql` en el SQL Editor de Supabase
y correrlo. Esa migración:

- Borra la tabla `respuestas_mensaje`.
- Borra las columnas `respondido*` y `respuesta_*` de `mensajes_contacto`.
- Borra las RPCs y vistas asociadas al thread.
- Recrea `panel_resumen` con KPIs simples (total mensajes, última semana,
  último mes, contactos, suscriptores).

Sin esa migración, el panel va a tirar errores porque consulta una vista
(`mensajes_con_thread`) que ya no existe.

---

## Siguiente fase: Editor de Newsletter

Después de la 008, el panel queda como **archivo de mensajes (read-only) +
base lista para newsletter**. El próximo bloque grande es el editor de
newsletter dentro de `/area-reservada/newsletter` (hoy figura como "pronto"
en el sidebar, deshabilitado).

Plan a alto nivel:

1. Migración nueva con tablas:
   - `newsletters` (id, asunto, html, json del editor, estado, creado_por, ...).
   - `newsletter_envios` (id, newsletter_id, contacto_id, estado, sent_at, ...).
   - Vista `panel_resumen` ampliada con KPIs de newsletter.
2. UI: editor por bloques en el panel
   (hero, párrafo, imagen, divisor, embed/link, columnas, CTA), preview en
   vivo, render a HTML email-safe.
3. Edge Function `enviar-newsletter` que use Resend Batch API para mandar a
   todos los `contactos.newsletter_optin = true`.
4. Tracking básico (opens, clicks) si Resend lo expone vía webhook.

---

## Cuando Emanuel mande material

- Foto de Emanuel para `/sobre-mi`.
- Link de MercadoPago del Curso Introductorio a la Simbología Hermética
  ($210.000).

---

## Fases siguientes

### Fase 2 — Migración de los ~1262 contactos legacy

- Importar contactos a la tabla `contactos`.
- Opt-in automático para newsletter (con aviso por mail + link de baja).
- Mejor hacerlo después del editor para enviar el primer newsletter
  inmediatamente.

### Fase 3 — LMS básico

Tablas `cursos`, `lecciones`, `inscripciones`, `progreso`. Páginas
`/cursos/[slug]` y `/cursos/[slug]/lecciones/[slug]` protegidas por
inscripción. Roles `alumno` / `docente` ya existen en `perfiles`.

### Fase 4 — Video hosting protegido

Cloudflare Stream o Bunny Stream con signed URLs. Reproductor custom que
chequee inscripción contra Supabase antes de pedir la URL firmada.

### Fase 5 — Pagos automatizados

MercadoPago Checkout Pro + webhook que auto-inscribe al usuario tras pago
confirmado. PayPal opcional para extranjeros.

### Fase 6 — Deploy a Ferozo

Push a la rama de producción → pull en Ferozo via Git → site público.

---

## Decisiones cerradas (referencia)

- ✅ El sitio captura la consulta en `mensajes_contacto`.
- ✅ La conversación se gestiona desde Gmail (la notificación tiene
  `Reply-To: <email del visitante>`, así Reply en Gmail responde directo).
- ✅ El panel es **archivo histórico read-only** + base para newsletter
  futuro. Sin gestión de respuestas dentro del panel.
- ✅ Login + perfiles + roles se mantienen (los necesita el newsletter y
  el LMS futuros).
- ❌ Descartado: Resend Inbound webhook (requería Pro o subdominio feo
  `*.resend.app` en el Reply-To).
- ❌ Descartado: panel con thread completo de respuestas (sobre-ingeniería,
  Gmail ya gestiona perfectamente).
- ❌ Descartado: IMAP polling sobre Donweb (riesgo de credenciales,
  complejidad sin ROI).

---

## Ya cerrado (referencia rápida)

- ✅ Migración SQL 005 (auth, perfiles, roles).
- ✅ Migración SQL 008 (limpieza, simplificación).
- ✅ Login + recuperar/cambiar password.
- ✅ Edge Function `notificar-mensaje-contacto` (mail con Reply-To al visitante).
- ✅ Panel: dashboard con KPIs básicos + bandeja read-only.
