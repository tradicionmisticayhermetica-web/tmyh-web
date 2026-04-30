# Arquitectura e infraestructura — Tradición Mística y Hermética

Este documento describe cómo está montado el sitio en producción. Sirve de
referencia maestra para cualquier persona que tome el proyecto en el futuro
o para volver a entender el flujo después de unas semanas sin tocarlo.

## Capa 1 — Hosting

### Donweb

Donweb es la **empresa de hosting argentina** que vende el servicio.
Manejan los planes ("Web Hosting Plan 1"), la facturación, los dominios
contratados (`tradicionmisticayhermetica.com` está registrado vía
Donweb), los certificados SSL y el soporte humano. Acá vive la cuenta
comercial, no se administran archivos directamente desde acá.

Cuando entrás a `panel.donweb.com` o `micuenta.donweb.com`, estás en la
"oficina comercial" del hosting: ves tus productos, pagás facturas, ves
el plan contratado. Para llegar a los archivos del sitio hay que pasar
de ahí a Ferozo.

### Ferozo

Ferozo es el **panel técnico** que Donweb provee adentro de cada plan
de hosting. Vive en `ferozo.host` y se accede con un usuario (tipo
`c2101039`) y contraseña distintos a los de Donweb. Es donde está el
File Manager, las cuentas FTP, los buzones de correo, la sección GIT
para vincular repos, las bases de datos MySQL, los registros DNS y todo
lo que tenga que ver con la administración técnica del hosting.

La diferencia conceptual: Donweb es el dueño del edificio, Ferozo es la
llave para entrar al departamento. Ambos vienen incluidos en el mismo
plan; no se contratan por separado.

En este proyecto, Ferozo cumple dos funciones concretas. Primero, sirve
los archivos estáticos del sitio (HTML, CSS, JS, imágenes) que viven en
`public_html/`. Segundo, tiene un módulo GIT que permite vincular un
repositorio remoto y hacer "Sincronizar" cuando hay cambios, lo que
ejecuta `git pull` desde el repo configurado hacia la carpeta de
destino. Eso es lo que reemplazó al antiguo workflow de subir archivos
por FTP.

## Capa 2 — Versionado del código (GitHub)

### Cuentas

Hay dos cuentas de GitHub involucradas. La cuenta personal de Juan
(`JuanMartinMarina`) **no se usa** para este proyecto. Todo lo que tiene
que ver con TM&H vive bajo la cuenta `tradicionmisticayhermetica-web`,
que se creó específicamente para los proyectos de la escuela. Esto
mantiene una separación limpia entre la identidad personal del
desarrollador y la identidad institucional del proyecto. Cada commit
firmado en este repo aparece atribuido a la cuenta de Tradición.

### Repositorios

Bajo la cuenta `tradicionmisticayhermetica-web` viven dos repositorios,
ambos privados.

`tmyh-wp-legacy` guarda el backup del WordPress viejo (tema, plugins,
uploads históricos). Quedó archivado como referencia histórica para no
perder nada de la versión anterior del sitio. No se toca más.

`tmyh-web` es el repositorio activo: tiene todo el código fuente,
documentación, scripts de migración, edge functions y migraciones SQL
del proyecto actual. Es lo que estás leyendo ahora.

### Ramas

El repo `tmyh-web` usa dos ramas con responsabilidades muy distintas.

La rama `main` contiene el código fuente completo: el sitio Astro en
`tmyh-web/`, la documentación en `docs/`, los scripts Python en
`scripts/`, las edge functions en `supabase/functions/`, etc. Esta rama
nunca toca el hosting; solo vive en GitHub. Cuando trabajás en el
proyecto, esta es la rama donde editás, commiteás y pusheás.

La rama `production` es de naturaleza muy distinta. Contiene únicamente
el resultado de compilar el sitio Astro: HTML estático, CSS minificado,
JavaScript empaquetado, imágenes optimizadas en WebP, todo en la raíz
del repo. Es decir, no tiene `package.json` ni `src/` ni nada del
código fuente; tiene el sitio "listo para servir". Ferozo está
configurado para clonar y hacer pull de **esta rama**, nunca de `main`.
Cada deploy genera un nuevo commit en `production`.

Esta separación cumple dos objetivos. Primero, la documentación
sensible (estructura de tablas SQL, planes internos, scripts con
emails) nunca se publica al dominio porque vive solo en `main`, que
Ferozo nunca pulea. Segundo, mantiene el repo `main` libre de la basura
de los builds (los archivos compilados cambian con cada cambio de
estilo y generarían diffs ruidosos en cada commit).

## Capa 3 — Claves SSH

Hay dos claves SSH distintas en el flujo, ambas registradas en la
cuenta de GitHub `tradicionmisticayhermetica-web`. Es importante
entender que GitHub permite varias claves por cuenta sin conflicto: lo
único que pide es que cada clave sea única (no se puede pegar la misma
clave en dos cuentas distintas).

La primera vive en el servidor de Ferozo. Cuando se configuró el
hosting, Ferozo generó un par de claves (privada y pública) en su lado.
La pública la pegamos en GitHub `Settings → SSH and GPG keys` de la
cuenta de Tradición. La privada quedó guardada dentro de la carpeta
`.ssh/` del HOME del hosting (a la que solo Ferozo tiene acceso). Esta
clave es la que se usa cuando alguien aprieta "Sincronizar" en el
módulo GIT de Ferozo: el servidor se conecta a GitHub, presenta su
clave privada, GitHub la valida contra la pública guardada y autoriza
el `git pull`. Esa clave nunca sale del servidor, nunca pasa por la PC
del desarrollador.

La segunda vive en la PC de Juan. Es una clave generada con
`ssh-keygen -t ed25519` y guardada en `C:\Users\Juan\.ssh\id_ed25519`.
La pública se pegó en la misma cuenta de GitHub
(`Settings → SSH and GPG keys`). Esta es la que se usa cuando, desde
local, se ejecuta `git push` o `git fetch` contra el repo. La clave
privada nunca se sube a GitHub, nunca se commitea al repo (`.ssh/`
estaría afuera del repo igual; `.env` y similares están en
`.gitignore`).

Hay un caso de borde a tener presente: si alguna vez se cambia la
máquina de desarrollo, hay que generar una clave nueva en la máquina
nueva y pegarla en GitHub. Igual con cualquier otra persona que vaya a
tener permiso de push. La clave de Ferozo no se toca nunca, vive ahí
para siempre (o hasta que se cambie de hosting).

## Capa 4 — Base de datos y backend dinámico (Supabase)

Supabase es el proveedor de Postgres gestionado, autenticación, edge
functions y storage. Vive en la nube de Supabase, fuera de Donweb. El
sitio se conecta directamente desde el navegador del visitante a la
API de Supabase usando una URL pública (`PUBLIC_SUPABASE_URL`) y una
clave anónima (`PUBLIC_SUPABASE_ANON_KEY`). Estas dos cosas son
visibles en el código JavaScript que se sirve al cliente, y eso es OK:
la `anon key` solo permite hacer lo que las policies de RLS de cada
tabla habilitan.

El proyecto en Supabase se llama `tradicionmisticayhermetica.com` y su
ID interno es `myezvgylayrbcoepawmt` (eso aparece en la URL de Supabase
y en `tmyh-web/.env`).

Las tablas principales son:

- `contactos` — directorio unificado de personas (alumnos e
  interesados). Importadas desde WordPress y Google Classroom durante
  la migración. Hoy tiene 1262 filas con `newsletter_optin = true`.
- `inscripciones` — vínculo entre un contacto y un curso, con
  trazabilidad de la fuente (`classroom:emanuel@gmail.com`,
  `wordpress:um`, etc.).
- `mensajes_contacto` — consultas que llegan desde el formulario de
  `/contacto` del sitio. Cada mensaje dispara un Database Webhook que
  llama a la edge function `notificar-mensaje-contacto`.
- `perfiles` — extiende `auth.users` con un campo `rol` (alumno,
  docente, admin, super_admin) y datos básicos. Solo `admin` y
  `super_admin` pueden entrar a `/area-reservada`.
- `panel_resumen` — vista que agrega los KPIs que muestra el dashboard
  del panel.

Las migraciones SQL viven en `docs/migrations/` numeradas
secuencialmente (001 a 009 al momento de escribir esto). Cada una tiene
un encabezado que explica qué hace, y son idempotentes (se pueden
correr varias veces sin romper nada). Para aplicarlas se copian al
SQL Editor de Supabase y se corre "Run".

Sobre RLS (Row Level Security): cada tabla tiene policies que definen
quién puede leer y escribir qué filas. Las decisiones tomadas:

- `contactos` e `inscripciones` solo las leen y escriben los admins
  (validado por `public.es_admin()`). Esto está en la migración 009.
- `mensajes_contacto` lo lee/edita el admin (mig 005). El INSERT lo
  hace el público (lo permite una RPC con `security definer` desde el
  formulario).
- `perfiles` lo lee/edita el propio usuario y los admins.

Las edge functions vienen del directorio `supabase/functions/`. Hoy hay
dos funciones activas:

- `notificar-mensaje-contacto`: se dispara con un Database Webhook cuando
  llega un mensaje y manda el aviso a Emanuel por mail vía Resend.
- `trigger-build`: dispara el workflow `deploy.yml` de GitHub para
  reconstruir y publicar el sitio cuando se publica contenido desde
  backoffice (posts y cursos en estado público).

Deploy:

- `npx supabase functions deploy notificar-mensaje-contacto --no-verify-jwt`
- `npx supabase functions deploy trigger-build --no-verify-jwt`

## Capa 5 — Email transaccional (Resend)

Resend es el servicio de envío de email transaccional usado para los
avisos del formulario de contacto. La cuenta tiene un solo dominio
verificado (`tradicionmisticayhermetica.com`) que es lo que permite
enviar mails con remitente `contacto@tradicionmisticayhermetica.com`
en vez del remitente genérico de Resend (que iría directo a spam).

Para verificar el dominio se agregaron registros DNS (MX, TXT con SPF,
TXT con DKIM, opcional DMARC) en la zona DNS del dominio en Donweb.
Esa configuración está hecha y no hay que volver a tocarla salvo que
se cambie el dominio.

Los `secrets` de Supabase (`RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO`)
son los que la edge function `notificar-mensaje-contacto` usa en
runtime. Se setean con `npx supabase secrets set NOMBRE=valor` desde
la línea de comandos.

El plan Free de Resend permite 3.000 mails por mes y 100 por día. Para
el volumen actual del formulario de contacto está sobrado. Cuando
implementemos el editor de newsletter y queramos mandar a los 1262
suscriptores, vamos a tener que evaluar si pasamos a Pro o partimos el
envío en lotes durante varios días.

## Capa 6 — Sitio frontend (Astro)

El sitio en sí está hecho en Astro 5 con TypeScript y Tailwind CSS 4.
Vive en la carpeta `tmyh-web/` del repo. Es un sitio estático: cuando
se corre `npm run build`, Astro genera todos los HTML, CSS, JS y
versiones optimizadas de las imágenes en `tmyh-web/dist/`. Ese
directorio es lo que se publica en Ferozo.

La configuración del proyecto tiene una particularidad importante. El
campo `base` de `astro.config.mjs` define con qué prefijo de URL se
sirve el sitio. Hoy está en `/`, lo que significa que el sitio se
sirve desde la raíz del dominio (`tradicionmisticayhermetica.com/`).
Durante el período de preview (cuando WordPress seguía vivo), el
`base` se manejaba con la variable de entorno `BASE_PATH=/tmyh-web/`
para servir desde `tradicionmisticayhermetica.com/tmyh-web/`. La
implementación con variable permite cambiar entre los dos modos sin
modificar el archivo: se pasa la variable solo al hacer build.

## Flujo de deploy

El ciclo completo de cómo un cambio llega al sitio en producción
funciona así. Primero, se trabaja localmente: se editan archivos en
`tmyh-web/src/`, se prueba con `npm run dev` que levanta un servidor
local en `localhost:4321`, se commiteán los cambios a la rama `main`
con un mensaje descriptivo y se pushean a GitHub.

Después se ejecuta el script `deploy.ps1` desde la raíz del repo.
Sin parámetros, builda con `BASE_PATH=/`. Con el flag `-Cutover` haría
lo mismo (al estado post-cutover, base `/` es el default de todos
modos). El script hace cuatro cosas. Compila el sitio Astro con la
base correcta. Clona la rama `production` en un directorio temporal del
disco. Vacía ese directorio y copia adentro el contenido del `dist/`
recién buildeado. Finalmente commiteá y pushea esa rama actualizada a
GitHub.

Eso deja la rama `production` en GitHub con el sitio compilado más
reciente. Para que llegue al hosting existen dos caminos:

1. Manual (siempre disponible): abrir Ferozo, ir a `Mi Sitio Web → GIT`,
   encontrar el repo `tmyh-web` y hacer click en "Sincronizar".
2. Automático (contenido desde backoffice): `trigger-build` dispara el
   workflow en GitHub y el hosting actualiza por su mecanismo programado.

En ambos casos, el resultado final es el mismo: `public_html/` queda con
la versión nueva de `production`.

Notar la asimetría intencional: el desarrollador empuja desde su PC al
GitHub, y el hosting baja desde GitHub al servidor. GitHub queda en el
medio como repositorio canónico. Ferozo nunca empuja a GitHub, solo
baja. Tampoco hay automatización entre el push a GitHub y el "pull en
Ferozo" — ese paso es manual y voluntario, lo que da control sobre
cuándo cae al sitio público un cambio. Si en el futuro queremos
automatizarlo, se puede armar una GitHub Action que dispare un webhook
hacia Ferozo, pero hoy no hace falta.

## Archivos ignorados por git y por qué

El `.gitignore` del proyecto excluye varias categorías de archivos.

Datos sensibles: la carpeta `data/` contiene los CSVs de la migración
con emails, nombres y teléfonos de alumnos. Es PII (información
personal) que no tiene que estar en el repo aunque sea privado, por
disciplina. Igual están los datos en Supabase.

Backups del WordPress viejo: la carpeta `wp-extracted/` (descompresión
del backup) y los archivos `*.wpress` (el backup completo de
All-in-One WP Migration, ~293 MB) son demasiado grandes para Git y
contienen toda la BD vieja con hashes y emails. Se quedan en disco
local y en una copia cifrada externa.

Credenciales: `.env` y todos los `.env.*` (excepto `.env.example` que
es la plantilla sin valores reales). También `*.pem` y `*.key` por si
alguna vez aparece un certificado. Acá viven las claves de Supabase y
demás. La `anon key` no es secreta pero por convención no se commitea.
La `service_role` sí es crítica y nunca se debe filtrar.

Builds: `node_modules/` (dependencias instaladas con npm, se regeneran
con `npm install`), `dist/` (output de `npm run build`, vive en la rama
`production` aparte), `.astro/` (cache interno de Astro). Todo esto se
puede regenerar y agrandaría inútilmente el repo.

Metadata local: `supabase/.temp/` con info del CLI de Supabase
(project-ref, pooler-url) que cada developer tiene en su máquina.
También cachés de IDEs (`.vscode/`, `.idea/`) y archivos del sistema
operativo (`.DS_Store`, `Thumbs.db`, `desktop.ini`).

Logs y archivos temporales: `*.log`, `npm-debug.log*`, etc. Se
generan al correr comandos pero nunca aportan al historial.

## Checklist para retomar el proyecto

Si vuelves después de un tiempo y querés actualizar algo, estos son
los pasos en orden. Asegurate de tener Node y npm instalados. Cloneá
el repo con `git clone git@github.com:tradicionmisticayhermetica-web/tmyh-web.git`
en una carpeta nueva (asume que tenés tu clave SSH ya configurada).
Entrá a `tmyh-web/` y hacé `npm install` para bajar las dependencias.
Copiá `tmyh-web/.env.example` a `tmyh-web/.env` y llená los valores
reales (URL y anon key de Supabase, los podés sacar del Dashboard de
Supabase → Settings → API). Levantá el dev con `npm run dev`. Hacé
los cambios que necesites, probalos en `localhost:4321`. Cuando estén
OK, commiteá y pusheá a `main`. Después corré `.\deploy.ps1` desde la
raíz, que va a hacer build y push a `production`. Por último, andá a
Ferozo → Mi Sitio Web → GIT → Sincronizar. Listo.
