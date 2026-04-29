# Guía de deploy

Esta guía describe cómo desplegar cambios al sitio. Para entender por qué
está montado así (qué hace cada pieza, cómo se vincula GitHub con
Ferozo, etc.) ver `docs/arquitectura.md`.

## El flujo en pocas líneas

Trabajás en `main` localmente, commiteás y pusheás. Después corrés
`.\deploy.ps1` desde la raíz, que builda el sitio y empuja el resultado
a la rama `production` en GitHub. Por último entrás a Ferozo y
clickeás "Sincronizar" en el módulo GIT, lo que hace que el hosting
baje la rama `production` y pise lo que está en `public_html/`. El
sitio queda actualizado en el dominio.

## Diagrama del flujo

```
Tu PC                                 GitHub
─────                                 ──────
                                      
src/ (Astro source)                   
  │                                   
  │ npm run build                     
  ▼                                   
tmyh-web/dist/                        
  │                                   
  │ deploy.ps1 (clona production en   
  │  un dir temp, copia dist al root, 
  │  commitea, push)                   
  ▼                                   
                ────────────────►   rama production
                git push origin       (solo build, en root)
                production
                                          │
                                          │  Ferozo: "Sincronizar"
                                          │  hace git pull origin production
                                          ▼
                                      Servidor Ferozo
                                      ──────────────
                                      public_html/
                                      ├── index.html
                                      ├── _astro/
                                      └── ...

                                      Visible en
                                      tradicionmisticayhermetica.com
```

## Pre-requisitos para deployar

Tener el repo clonado localmente, con la SSH key de la PC ya configurada
en GitHub (ver `docs/arquitectura.md` sección "Claves SSH"). Tener
Node y npm instalados para correr el build de Astro. Tener `tmyh-web/.env`
con `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` (sin esto el
build genera bundles inválidos y los formularios no funcionan).

## Pasos para deployar un cambio

1. Hacer el cambio en alguna página o componente del sitio dentro de
   `tmyh-web/src/`. Probarlo en `localhost:4321` con `npm run dev`
   desde la carpeta `tmyh-web/`.
2. Commitear el cambio a la rama `main` con un mensaje descriptivo.
   Pushear con `git push`.
3. Desde la raíz del repo, ejecutar `.\deploy.ps1`. El script:
   - Compila el sitio con `BASE_PATH=/` (default post-cutover).
   - Clona la rama `production` en un directorio temporal.
   - Reemplaza el contenido de esa rama temporal con el `dist/` recién
     buildeado.
   - Hace commit y push de la rama `production` actualizada.
4. Abrir [el panel de Donweb](https://panel.donweb.com), entrar al
   plan de hosting, "Panel de Hosting" → ingresar al panel de Ferozo.
5. Dentro de Ferozo: `Mi Sitio Web → GIT`. Encontrar el repo `tmyh-web`
   en la lista (debería estar el único).
6. Click en "Sincronizar" (o el ícono de actualizar de las acciones).
   Ferozo va a hacer `git pull origin production` y bajar los cambios.
7. Verificar el sitio en `tradicionmisticayhermetica.com`. Si hay
   cambios visuales, recargar con `Ctrl+F5` para evitar caché.

## El script `deploy.ps1` con detalle

El script vive en la raíz del repo y acepta dos flags:

- `.\deploy.ps1` (sin flags): builda con `BASE_PATH=/`. Es lo que
  usás siempre post-cutover.
- `.\deploy.ps1 -Cutover`: idéntico al anterior. El flag existe por
  compatibilidad con cuando había un modo "preview" en
  `/tmyh-web/`. Se puede ignorar.
- `.\deploy.ps1 -SkipBuild`: salta el build (útil si ya tenés el
  `dist/` recién hecho y solo querés re-pushear la rama
  `production`). No se usa habitualmente.

El script hace todo el trabajo pesado: levanta `BASE_PATH` como
variable de entorno antes del build, crea o reutiliza un directorio
temporal en `%TEMP%\tmyh-prod-deploy`, intenta clonar la rama
`production` (si existe en remoto preserva la historia, si no la crea
desde cero), copia el `dist/` resultante adentro, y hace commit y push.
Al final limpia el directorio temporal.

Si algo falla (típicamente porque no se puede conectar al SSH de
GitHub), el script aborta y deja un mensaje claro.

## Configuración de Ferozo (referencia)

Esto ya está hecho desde el cutover y no debería necesitar tocarse,
pero por si hay que recrearlo: en Ferozo `Mi Sitio Web → GIT → Crear
nuevo`, el repo se configura con:

- Repositorio: `git@github.com:tradicionmisticayhermetica-web/tmyh-web.git`
- Rama: `production` (importante: nunca apuntar a `main`)
- Directorio: vacío (eso hace que clone en `public_html/` directo, no
  en una subcarpeta)

Para que esto funcione, la SSH key del servidor de Ferozo tiene que
estar pegada en `Settings → SSH and GPG keys` de la cuenta GitHub
`tradicionmisticayhermetica-web`. Eso también está hecho, no se toca.

## Hacer cambios sin deployar (modo preview)

A veces querés mostrar un cambio antes de publicarlo. Hay dos formas.
La más simple es levantar el dev server y abrirle un túnel Cloudflare:

```powershell
# Terminal 1
cd tmyh-web
npm run dev

# Terminal 2 (en otra ventana)
cloudflared tunnel --url http://localhost:4321
```

Eso te da una URL pública temporal `https://xxx.trycloudflare.com` que
podés mandarle a alguien. El tunnel y el dev server tienen que estar
corriendo mientras dure la prueba.

La otra forma es hacer build local y abrir el preview:

```powershell
cd tmyh-web
npm run build
npm run preview
```

Esto sirve el build en `localhost:4322` exactamente como saldría en
producción. Útil para detectar errores que no aparecen en `dev`.

## Troubleshooting

**Error de SSH al pushear a GitHub**: verificar que `ssh -T git@github.com`
desde tu terminal responda "Hi tradicionmisticayhermetica-web!". Si no,
revisar que tu clave pública esté pegada en GitHub Settings de la
cuenta correcta. Si la borraste, regenerar con `ssh-keygen -t ed25519`
y volver a pegarla.

**El sitio no actualiza después del Sincronizar**: lo más común es
caché del navegador. Probar `Ctrl+F5`. Si sigue, abrir el sitio en una
ventana incógnita. Si sigue, verificar en GitHub que la rama
`production` tenga el commit que esperabas (mirar el hash del último
commit y compararlo con lo que dice Ferozo).

**El build falla**: verificar que `tmyh-web/.env` tenga las dos
variables (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`) con
valores reales. Si vino un cambio nuevo a `package.json`, correr
`npm install` antes de buildear de nuevo.

**Ferozo dice "directorio no vacío" al crear el repo**: hay archivos
ocultos en `public_html/` (típico: `.htaccess`, `.htpasswd`). Hay que
borrarlos antes de crear el repo. En el File Manager de Ferozo se ven
si activás "mostrar archivos ocultos".

## Histórico de deploys

Cada deploy es un commit nuevo en la rama `production`. Para ver el
histórico:

```powershell
git fetch origin
git log origin/production --oneline
```

Cada commit muestra fecha y hora. Si necesitamos volver a una versión
anterior del sitio, podemos hacer reset hard a ese commit y push
forzado a `production`. Después en Ferozo Sincronizar, y el sitio
queda en esa versión vieja.
