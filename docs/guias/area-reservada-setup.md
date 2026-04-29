# Guía de setup: Área Reservada (Fase 1A)

Este documento explica cómo dejar funcionando el panel de administración del sitio en cinco pasos. Después de seguir esta guía vas a tener:

- Una página `/login` para que Emanuel (y otros admins) ingresen.
- Un panel `/area-reservada` con dashboard, bandeja de mensajes y vista de detalle.
- Un botón "Responder en el panel" en el email de notificación que abre directo el mensaje en el panel con el form precargado.
- Un sistema de roles (`alumno`, `docente`, `admin`, `super_admin`) que vamos a usar en fases siguientes.

---

## 1. Correr la migración 005 en Supabase

Abrí Supabase → SQL Editor → New query y pegá el contenido de:

```
docs/migrations/005_admin_panel.sql
```

Click "Run". Debería decir "Success. No rows returned." (o similar).

Esto crea:

- Tabla `public.perfiles`.
- Funciones `es_admin()` y `es_super_admin()`.
- Trigger que crea un perfil automáticamente cada vez que se registra un usuario en Supabase Auth.
- Columnas `respondido`, `respondido_en`, `respondido_por`, `respuesta_asunto`, `respuesta_cuerpo` en `mensajes_contacto`.
- Policies RLS para que admins puedan leer/actualizar mensajes y perfiles.
- Vista `mensajes_contacto_pendientes` para la bandeja.
- Vista `panel_resumen` para el dashboard.
- RPC `marcar_mensaje_respondido(...)` para que la edge function marque los mensajes como respondidos.

---

## 2. Crear el primer usuario super_admin (Emanuel)

### 2.1 Crear el usuario en Auth

Supabase Dashboard → **Authentication** → **Users** → botón **"Add user"** → **"Create new user"**.

- Email: `tradicionmisticayhermetica@gmail.com` (o el que quieras usar para login).
- Password: contraseña fuerte (anotala en un gestor).
- Tildá **"Auto Confirm User"** para que no tenga que validar el email.
- Click "Create user".

### 2.2 Promoverlo a super_admin

El trigger ya creó automáticamente la fila en `public.perfiles` con rol `alumno`. Tenés que pasarlo a `super_admin`. SQL Editor → New query:

```sql
update public.perfiles
   set rol = 'super_admin'
 where email = 'tradicionmisticayhermetica@gmail.com';
```

Verificalo:

```sql
select id, email, rol, activo from public.perfiles;
```

Tiene que aparecer con rol `super_admin` y activo `true`.

> Si querés crear más admins después, repetí 2.1 y 2.2 cambiando el rol a `admin` (admin común sin permisos especiales) o `super_admin` (todos los permisos, incluido el manejo de roles más adelante).

---

## 3. Desplegar la nueva Edge Function `responder-mensaje`

Desde la raíz del proyecto:

```powershell
cd C:\Users\Juan\Desktop\TMyH
npx supabase functions deploy responder-mensaje
```

Esta función:

1. Valida que quien la llama sea admin (vía JWT y `es_admin()`).
2. Envía el mail de respuesta vía Resend desde `contacto@tradicionmisticayhermetica.com`.
3. Marca el mensaje como respondido en la BBDD.

> **IMPORTANTE**: a diferencia de `notificar-mensaje-contacto`, **no usamos `--no-verify-jwt`**. Queremos que Supabase valide el token del admin antes de invocar la función.

### Variables de entorno

Las que ya tenías (`RESEND_API_KEY`, `EMAIL_FROM`) sirven para esta función también, no hace falta agregar nada nuevo.

Verificalo con:

```powershell
npx supabase secrets list
```

Tienen que aparecer `RESEND_API_KEY` y `EMAIL_FROM`.

---

## 4. Re-desplegar la Edge Function `notificar-mensaje-contacto`

Esta la actualicé para que el botón "Responder" del email abra el panel en lugar de Gmail:

```powershell
npx supabase functions deploy notificar-mensaje-contacto --no-verify-jwt
```

Opcional: configurá la URL del sitio si en algún momento usás un dominio distinto al de producción para previews. Por defecto usa `https://www.tradicionmisticayhermetica.com`.

```powershell
npx supabase secrets set SITE_URL="https://www.tradicionmisticayhermetica.com"
```

---

## 5. Probar el flujo end-to-end

### 5.1 Loguearte

Levantá el dev server:

```powershell
cd C:\Users\Juan\Desktop\TMyH\tmyh-web
npm run dev
```

Abrí `http://localhost:4321/login` (o el puerto que te muestre Astro).

Ingresá con el email y password que creaste en el paso 2.1. Debería redirigirte a `/area-reservada` y ver el dashboard con el resumen.

### 5.2 Mandar una consulta de prueba

Desde `/contacto`, completá el form con un email cualquiera (puede ser el tuyo personal). Enviá.

### 5.3 Recibir la notificación

Tendrías que recibir el email en `tradicionmisticayhermetica@gmail.com` con el botón "Responder en el panel". Click → abre `/area-reservada/mensaje?id=<uuid>` con la respuesta precargada.

### 5.4 Responder desde el panel

Editá el cuerpo si querés y click "Enviar respuesta". El visitante debería recibir el mail desde `contacto@tradicionmisticayhermetica.com`. El mensaje queda marcado como "Respondido" y desaparece de la bandeja de pendientes.

---

## Estructura de archivos creados / modificados

```
docs/migrations/005_admin_panel.sql         (nuevo)
supabase/functions/responder-mensaje/       (nuevo)
supabase/functions/notificar-mensaje-contacto/index.ts  (modificado)
tmyh-web/src/lib/supabase.ts                (modificado: persistSession=true)
tmyh-web/src/lib/auth.ts                    (nuevo)
tmyh-web/src/lib/admin.ts                   (nuevo)
tmyh-web/src/layouts/AdminLayout.astro      (nuevo)
tmyh-web/src/pages/login.astro              (nuevo)
tmyh-web/src/pages/area-reservada/index.astro      (nuevo)
tmyh-web/src/pages/area-reservada/mensajes.astro   (nuevo)
tmyh-web/src/pages/area-reservada/mensaje.astro    (nuevo)
```

---

## Cosas que NO hace todavía esta fase

Para que quede claro qué viene en fases posteriores y no esperes lo que no está:

- **Fase 1B**: editor de newsletter visual y envío masivo (próxima sesión).
- **Fase 2**: usar los roles `alumno` y `docente`. Hoy solo `admin` y `super_admin` ven el panel; los otros roles ya están en la BBDD pero no tienen vistas propias.
- **Migración masiva** de los ~1262 contactos existentes a usuarios de Auth: la haremos en Fase 2.
- **Recuperación de contraseña**: hay que activar email templates de Supabase (lo dejamos para Fase 2; por ahora si Emanuel olvida la pass, la reseteás manualmente desde el Dashboard).
- **Logging detallado** de cada respuesta enviada, métricas, etc.: por ahora solo guardamos asunto/cuerpo en `mensajes_contacto`.

---

## Troubleshooting

**"Esta cuenta no tiene acceso al panel"** al intentar loguearse:

- Verificá que el rol del usuario sea `admin` o `super_admin` en `public.perfiles`. Si quedó como `alumno`, corré el `update` del paso 2.2.

**"No pude conectar con el servidor"** al enviar respuesta:

- La edge function `responder-mensaje` no está desplegada. Volvé al paso 3.
- O `RESEND_API_KEY` no está bien configurada. Hacé `npx supabase secrets list` para verificar.

**"Sesión expirada"** después de unos minutos:

- Es normal: Supabase refresca el JWT solo. Si no anda, recargá la página y debería re-loguearse automáticamente.

**El badge de "Pendientes" en el sidebar no aparece o muestra 0 cuando hay mensajes**:

- Las RLS de `panel_resumen` o `mensajes_contacto` no están bien. Probá correr de nuevo la migración 005 (es idempotente).

**El link "Responder en el panel" del email lleva al dominio incorrecto**:

- El secret `SITE_URL` no está bien configurado. Corregilo con `npx supabase secrets set SITE_URL="..."` y re-desplegá `notificar-mensaje-contacto`.
