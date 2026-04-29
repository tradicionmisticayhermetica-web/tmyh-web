# Guía de deploy a Ferozo

Esta guía describe cómo está armado el flujo de deploy y cómo desplegar
cambios al sitio.

## Arquitectura

```
GitHub: tradicionmisticayhermetica-web/tmyh-web (privado)
│
├── main         ← Source code (lo que vemos al editar). Solo en GitHub.
│
└── production   ← Solo el dist/ compilado, en root. Es lo que pulea Ferozo.
                   Cada deploy es un commit nuevo.
                                                 │
                                                 ▼
                       Ferozo "Sincronizar" → git pull production
                                                 │
                                                 ▼
                       public_html/tmyh-web/index.html  (sitio en vivo)
```

- **`main`**: tiene todo el repo (sitio Astro + docs + scripts + edge
  functions). Las migraciones SQL, scripts de Python, etc. NO se publican.
- **`production`**: tiene únicamente el contenido de `tmyh-web/dist/` ya
  compilado (HTML, CSS, JS, imágenes optimizadas), en root. Es la rama que
  consume Ferozo.

## URLs

- **Hoy**: el sitio se sirve como preview en
  `https://www.tradicionmisticayhermetica.com/tmyh-web/`. WordPress sigue
  vivo en la raíz del dominio.
- **Después del cutover (Fase 6)**: el sitio nuevo pasa a la raíz.
  WordPress se baja.

## Cómo deployar un cambio

Desde la raíz del repo:

```powershell
.\deploy.ps1
```

Eso hace todo: build con `BASE_PATH=/tmyh-web/`, crea/actualiza la rama
`production` con el `dist/` resultante en root, pushea a GitHub.

Después, en el panel de **Ferozo → Mi sitio web → GIT**, click en
**Sincronizar** del repo `tmyh-web`. Eso hace `git pull` de la rama
`production` y los archivos del nuevo build pisan los viejos.

Listo. El sitio queda actualizado.

## Configuración inicial de Ferozo (una sola vez)

Esta configuración ya debería estar hecha desde la sesión anterior, pero
acá quedan los pasos por si hay que rehacerla:

1. **Ferozo → Mi sitio web → Administrador de archivos**: crear directorio
   vacío `public_html/tmyh-web/` (si no existe).
2. **Ferozo → Mi sitio web → GIT → Crear nuevo**:
   - **Repositorio**: `git@github.com:tradicionmisticayhermetica-web/tmyh-web.git`
   - **Rama**: `production` ⚠️ (NO `main`, esa es source code)
   - **Directorio**: `tmyh-web` (queda en `public_html/tmyh-web/`)
3. **Crear ahora**. Ferozo va a hacer `git clone -b production` usando la
   SSH key que ya pegaste en GitHub.

Si la sesión anterior dejó configurado el repo apuntando a `main`, hay que
**editarlo y cambiar la rama a `production`**.

## Cutover (Fase 6 — apagar WordPress y servir desde root)

Cuando el sitio nuevo esté validado y queramos apagar WordPress:

1. Hacer build con `base = "/"`:
   ```powershell
   .\deploy.ps1 -Cutover
   ```
2. En Ferozo, mover (o renombrar) el WordPress viejo de `public_html/` a
   otro lugar (ej. `public_html-wp-old/`) para liberar la raíz.
3. Reconfigurar el repo en Ferozo para que clone en `public_html/` directo,
   o mover el contenido de `public_html/tmyh-web/` a `public_html/`.
4. Hacer `Sincronizar` con el deploy nuevo.

Detalles específicos cuando llegue el momento. Hasta entonces, el sitio
nuevo vive en la subcarpeta `/tmyh-web/`.

## Troubleshooting

**Error de SSH al hacer push**: verificar que `ssh -T git@github.com`
responda "Hi tradicionmisticayhermetica-web!". Si no, regenerar la SSH key
y agregarla en [github.com/settings/keys](https://github.com/settings/keys)
estando logueado como `tradicionmisticayhermetica-web`.

**Sitio en blanco después de Sincronizar en Ferozo**: probable problema
de `base`. Verificar que el script se haya corrido sin `-Cutover` (default)
y que el `dist/` tenga las URLs apuntando a `/tmyh-web/...`.

**El build falla con error de variables de entorno**: verificar que
`tmyh-web/.env` tenga `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`.
Sin esas, Astro genera un build con valores inválidos y los formularios
no funcionan.

**El sitio carga pero los formularios no envían**: probablemente el
`PUBLIC_SUPABASE_ANON_KEY` cambió. Revisar Supabase Dashboard →
**Settings** → **API**, copiar el `anon` key actualizado a
`tmyh-web/.env`, rebuildar y deployar.

## Histórico de deploys

Cada deploy es un commit en la rama `production`. Para ver el histórico:

```powershell
git fetch origin
git log origin/production --oneline
```

Cada commit muestra fecha y hora del deploy. Si necesitamos volver a una
versión anterior del sitio, podemos hacer reset hard a ese commit y push
forzado a `production`.
