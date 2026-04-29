# Guía del panel admin (`/area-reservada`)

Esta guía explica qué hace el panel administrativo, cómo se crean
usuarios admin y cómo se configura todo. Para entender la
infraestructura general del proyecto ver `docs/arquitectura.md`.

## Qué es el panel hoy

El panel `/area-reservada` es un espacio privado del sitio al que solo
acceden usuarios con rol `admin` o `super_admin`. Hoy cumple dos
funciones. Primero, sirve como archivo histórico de los mensajes de
contacto recibidos: muestra una lista de las consultas que llegaron
desde el formulario público y permite ver el detalle de cada una.
Segundo, es la base sobre la cual se va a montar el editor de blog y
el envío de newsletter en próximas iteraciones.

Las respuestas a los visitantes no se gestionan desde el panel: cada
notificación de nuevo mensaje llega al Gmail de Emanuel
(`tradicionmisticayhermetica@gmail.com`) con `Reply-To` apuntando al
email del visitante. Cuando Emanuel responde desde Gmail, el mail sale
directo al visitante. El panel solo conserva el registro de la
consulta original.

## Estructura de roles

Hay cuatro roles posibles definidos en la tabla `public.perfiles`:
`alumno`, `docente`, `admin` y `super_admin`. Los dos primeros existen
preparados para fases futuras (LMS, area de alumnos) pero hoy no tienen
funcionalidad activa. Solo `admin` y `super_admin` pueden entrar al
panel; el resto rebota al login con un mensaje de "no tenés acceso".

Cuando un usuario nuevo se crea en Supabase Auth, un trigger
(`handle_nuevo_usuario`) inserta automáticamente la fila
correspondiente en `perfiles` con rol por defecto `alumno`. Para
promoverlo a admin hay que actualizarlo manualmente.

## Crear un usuario admin

Esto se hace una sola vez al inicio del proyecto, y después si se
quieren agregar más admins. El usuario actual administrador es
`tradicionmisticayhermetica@gmail.com`.

Primero, crear el usuario en Supabase Auth: Dashboard →
Authentication → Users → "Add user" → "Create new user" → email y
contraseña fuerte → tildar "Auto Confirm User" → Create. El trigger
inserta la fila en `perfiles` con rol `alumno`.

Segundo, promoverlo a admin con SQL:

```sql
update public.perfiles
   set rol = 'super_admin'
 where email = 'tradicionmisticayhermetica@gmail.com';
```

Verificar:

```sql
select id, email, rol, activo from public.perfiles;
```

Tiene que aparecer con `super_admin` y `activo = true`.

## Migraciones SQL involucradas

El panel se construyó incrementalmente. Las migraciones relevantes:

La migración 005 crea la tabla `perfiles`, los helpers `es_admin()` y
`es_super_admin()`, el trigger que crea perfiles automáticamente, y
las RLS policies para `mensajes_contacto` (admins pueden leer y
actualizar). También crea la vista inicial de KPIs.

La migración 008 simplifica el panel después de que decidimos no
gestionar respuestas dentro del sitio. Borra las tablas, vistas y RPCs
que se habían creado para el flujo de respuestas (que terminó siendo
sobre-ingeniería) y deja `panel_resumen` con KPIs simples: total de
mensajes, mensajes de la última semana, último mes, total de
contactos, suscriptores de newsletter.

La migración 009 agrega las RLS policies de admins para `contactos` e
`inscripciones`. Sin esto, la vista `panel_resumen` mostraba 0
contactos aunque la tabla tuviera 1262 (porque sin policies abiertas,
el JWT del admin no podía leer las filas).

Las tres migraciones ya están aplicadas. Si se reinstala el proyecto
en otra Supabase, hay que correrlas en orden numérico.

## Edge function asociada

`notificar-mensaje-contacto` es la única edge function activa. Se
dispara con un Database Webhook cada vez que se inserta una fila en
`mensajes_contacto`. Manda un email a Emanuel con los datos del
mensaje y `Reply-To` al email del visitante para que el reply en
Gmail vaya directo.

Para deployarla:

```powershell
npx supabase functions deploy notificar-mensaje-contacto --no-verify-jwt
```

El flag `--no-verify-jwt` es importante: la llamada viene de un
webhook interno de Supabase, no de un usuario autenticado.

Los secrets que la función usa (ya seteados, no hace falta tocar):

- `RESEND_API_KEY`: clave de la API de Resend.
- `EMAIL_FROM`: `Tradicion Mistica y Hermetica <contacto@tradicionmisticayhermetica.com>`.
- `EMAIL_TO`: `tradicionmisticayhermetica@gmail.com`.

Para listar los secrets actuales:

```powershell
npx supabase secrets list
```

## Database Webhook

Configurado desde Supabase Dashboard → Database → Webhooks. Trigger:
INSERT en `public.mensajes_contacto`. Tipo: Supabase Edge Function.
Función: `notificar-mensaje-contacto`. Eso ya está creado, solo se
menciona acá por si hay que recrearlo en otro proyecto.

## Recuperación de contraseña

El flujo de recuperación de contraseña usa los emails templates de
Supabase Auth. La página `/recuperar-password` del sitio invoca la
función `solicitarResetPassword` que dispara un email al usuario con
un link a `/restablecer-password?token=...`. El token llega como
parámetro y la página lo procesa para permitir cambiar la contraseña.

Para que esto funcione en producción, los Redirect URLs en Supabase
Dashboard → Authentication → URL Configuration deben incluir el
dominio del sitio:

```
https://www.tradicionmisticayhermetica.com/restablecer-password
https://www.tradicionmisticayhermetica.com/area-reservada
```

## Estructura de las páginas del panel

`/login`: form de login. Si la sesión es válida y el rol es admin,
redirige a `/area-reservada`. Si no, muestra error.

`/area-reservada`: dashboard con cuatro KPIs (mensajes totales, última
semana, último mes, suscriptores newsletter) y la lista de los 5
mensajes más recientes recibidos.

`/area-reservada/mensajes`: lista completa de mensajes, ordenados por
fecha descendente, con buscador por nombre/email/curso.

`/area-reservada/mensaje?id=...`: detalle de un mensaje individual.
Muestra los datos del visitante, el mensaje original, y un aviso de
que las respuestas se gestionan desde Gmail.

`/area-reservada/cuenta`: página para cambiar contraseña del admin
logueado.

`/recuperar-password` y `/restablecer-password`: flujo de recuperación.

## Próximas iteraciones

El panel está pensado como cimiento del backoffice editorial. Las
próximas funcionalidades a sumar son: editor de blog que permita
publicar posts directamente al sitio, y editor de newsletter para
mandar contenido a los 1262 suscriptores. Detalle en
`docs/PENDIENTES.md`.
