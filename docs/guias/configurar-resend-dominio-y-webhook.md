# Configurar emails profesionales con Resend + dominio Donweb + webhook de Supabase

Esta guía describe paso a paso cómo activar los emails reales (notificación
a Emanuel + newsletter) cuando tengas el tiempo para hacerlo. Se puede
completar en **45-60 minutos** la primera vez.

No hay que correrla ahora: el código ya está preparado. Hasta que estos
pasos no estén hechos, los mensajes del formulario se guardan en
`public.mensajes_contacto` pero no dispara ningún email.

---

## Resumen del flujo final

```
Formulario /contacto
    │
    ▼
supabase.rpc('enviar_mensaje_contacto')
    │
    ▼
INSERT en public.mensajes_contacto
    │
    ▼  (Database Webhook)
Edge Function `notificar-mensaje-contacto`
    │
    ▼  (HTTPS a api.resend.com)
Resend
    │
    ▼
Gmail de Emanuel (tradicionmisticayhermetica@gmail.com)
```

---

## Paso 1 — Crear cuenta en Resend (10 min)

1. Ir a <https://resend.com> → **Sign Up** (usar el mismo gmail de Emanuel o uno tuyo admin).
2. Confirmar el email.
3. Plan gratuito: **3.000 emails/mes, 100/día** — suficiente para empezar.
4. En el dashboard, copiar la API Key que aparece en "API Keys" (arranca
   con `re_`). **Guardarla apenas la veas; no la vuelven a mostrar**.

---

## Paso 2 — Verificar el dominio en Resend (20 min)

Esto es lo que te permite enviar desde `contacto@tradicionmisticayhermetica.com`
en vez de `onboarding@resend.dev`. Sin verificar el dominio los mails caen
directo a spam.

### 2.1. En Resend

1. Dashboard → **Domains** → **Add Domain**.
2. Dominio: `tradicionmisticayhermetica.com`.
3. Resend te muestra entre 3 y 5 registros DNS que hay que cargar.
   Los típicos son cuatro: un registro MX con nombre `send` apuntando
   a `feedback-smtp.us-east-1.amazonses.com` con prioridad 10; un
   registro TXT con nombre `send` y valor
   `v=spf1 include:amazonses.com ~all` (eso es el SPF); un registro
   TXT con nombre `resend._domainkey` y como valor una clave DKIM
   larga (la que empieza con `p=...`); y opcionalmente un registro
   TXT con nombre `_dmarc` y valor `v=DMARC1; p=none;` para DMARC.
   Los valores exactos te los da Resend al agregar el dominio:
   copialos tal cual.

### 2.2. En el panel de Donweb

1. Entrar al panel de Donweb → **Mis Productos** → Dominios →
   `tradicionmisticayhermetica.com` → **Administrar DNS** (o "Zona DNS").
2. Para cada registro de arriba:
   - **Tipo**: el que dice Resend (MX, TXT).
   - **Nombre / host**: copiar exactamente lo que dice Resend. Donweb
     a veces pide sólo `send` y el resto lo completa con el dominio,
     otras veces pide `send.tradicionmisticayhermetica.com`. Si duda,
     poner el nombre corto.
   - **Valor**: pegar el valor que dio Resend.
   - **TTL**: dejar el default (3600).
3. **Guardar cambios**. La propagación DNS tarda entre 5 min y 48 h.
   En la práctica suele ser 15-30 min.
4. Volver a Resend → Domain → **Verify DNS Records**. Cuando los 3
   queden en verde, el dominio está listo.

### 2.3. Crear el alias `contacto@`

Esto se hace en el correo electrónico de Donweb, no en Resend. Resend
no **recibe** mails, solo los **envía**. Para que cuando alguien responda
a `contacto@...` llegue a un inbox real:

1. Panel de Donweb → **Correo electrónico** → **Cuentas de email**.
2. Crear cuenta: `contacto@tradicionmisticayhermetica.com`.
3. Opciones:
   - **A)** Crear el inbox en Donweb y que Emanuel lo revise ahí
     (le das usuario y contraseña).
   - **B)** Crear un **forward** que reenvía todo lo que llegue a
     `contacto@...` a `tradicionmisticayhermetica@gmail.com`. Esta
     es la opción más cómoda: Emanuel sigue usando su Gmail para todo.

Recomiendo la **B**. Donweb tiene un módulo "Redireccionamientos" o
"Forwarders" que te lo permite.

---

## Paso 3 — Configurar las variables de entorno en Supabase (5 min)

1. Supabase Dashboard → **Project Settings** → **Edge Functions** →
   **Secrets** (o desde la CLI: `npx supabase secrets set`).

2. Agregar:

```
RESEND_API_KEY      = re_xxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM          = Tradición Mística y Hermética <contacto@tradicionmisticayhermetica.com>
EMAIL_TO            = tradicionmisticayhermetica@gmail.com
```

> Mientras no tengas el dominio verificado, podés probar con
> `EMAIL_FROM = "Test <onboarding@resend.dev>"`. Resend te deja
> enviar desde ese remitente sin verificar nada, pero solo llega
> al email de la cuenta que creó la cuenta de Resend.

---

## Paso 4 — Desplegar la Edge Function (5 min)

Desde la raíz del repo:

```powershell
# primera vez: vincular el proyecto local con el de Supabase
npx supabase login
npx supabase link --project-ref <tu-project-ref>

# deployar
npx supabase functions deploy notificar-mensaje-contacto --no-verify-jwt
```

El flag `--no-verify-jwt` es importante porque la llamada viene de un
webhook interno de Supabase, no de un usuario autenticado.

Verificar que haya quedado arriba:

- Dashboard → **Edge Functions** → `notificar-mensaje-contacto` →
  debe decir "Active".

---

## Paso 5 — Crear el Database Webhook (5 min)

1. Supabase Dashboard → **Database** → **Webhooks** → **Create a
   new hook**.
2. Configurar:
   - **Name**: `notificar-nuevo-mensaje`
   - **Table**: `public.mensajes_contacto`
   - **Events**: ☑ `Insert` (dejar los otros desmarcados)
   - **Type**: `Supabase Edge Function`
   - **Edge Function**: `notificar-mensaje-contacto`
   - **HTTP Headers**: dejar vacío
   - **HTTP Params**: dejar vacío
3. Guardar.

---

## Paso 6 — Probar de punta a punta (5 min)

1. Abrir el sitio → `/contacto` → llenar el formulario → enviar.
2. Supabase Dashboard → **Table Editor** → `mensajes_contacto` → ver
   que apareció la nueva fila.
3. Gmail de Emanuel → el email debería llegar en 5-30 segundos.
4. Apretar el botón **"Responder"** del email → debería abrir Gmail
   en otra pestaña con el destinatario y el asunto pre-llenados.

Si no llega:

- Supabase Dashboard → **Edge Functions** → `notificar-mensaje-contacto`
  → **Logs**. Ahí se ven los errores en tiempo real.
- Resend Dashboard → **Emails** → muestra cada intento y el motivo si
  falló (típicamente: dominio no verificado o API key inválida).

---

## Paso 7 — Activar el newsletter (más adelante)

Cuando quieras mandar el primer newsletter:

1. Copiar `docs/newsletter/plantilla-newsletter.html`.
2. Reemplazar los `{{placeholders}}` con contenido real.
3. Para la lista de destinatarios:

   ```sql
   select id, email, nombre, newsletter_token_unsubscribe
     from public.newsletter_suscriptores;
   ```

4. Armar cada email personalizando `{{UNSUBSCRIBE_URL}}` y
   `{{PREFERENCIAS_URL}}` con el token de ese contacto:

   ```
   https://www.tradicionmisticayhermetica.com/newsletter/unsubscribe?token=<uuid>
   https://www.tradicionmisticayhermetica.com/newsletter/preferencias?token=<uuid>
   ```

5. Enviarlos desde Resend (hay una API `POST /emails/batch` para mandar
   varios de una). Si querés que lo automatice con un script Node,
   avisame y lo armamos cuando llegue el momento.

---

## Costos

- **Resend**: gratis hasta 3.000 mails/mes. Plan pagos desde 20 USD/mes
  (50k mails).
- **Donweb**: el forwarder y el alias de correo ya están incluidos en
  el hosting.
- **Supabase**: las Edge Functions y los webhooks están dentro del plan
  gratuito (500k invocaciones/mes).

Para el volumen de TMyH (2000 suscriptores × 1 newsletter/mes + algunos
mensajes de contacto al día), estás **muy holgado** en el plan gratis
de Resend.

---

## Alternativa: arrancar rápido sin verificar dominio

Si querés probar el flujo **hoy mismo** sin esperar la verificación DNS:

1. En Resend, usar `EMAIL_FROM = "onboarding@resend.dev"`.
2. `EMAIL_TO` debe ser el mismo email con el que te registraste en
   Resend (es una limitación del plan trial hasta verificar).
3. Completás los pasos 3-6.
4. Después, cuando verifiques el dominio, cambiás el `EMAIL_FROM`.
