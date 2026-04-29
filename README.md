# Tradición Mística y Hermética — repositorio del sitio

Este repositorio contiene el código del sitio web público de
**Tradición Mística y Hermética** ([tradicionmisticayhermetica.com](https://www.tradicionmisticayhermetica.com))
y toda la infraestructura asociada: migraciones de base de datos,
edge functions, scripts de migración y documentación interna.

## Estado actual

Sitio en producción. WordPress fue reemplazado por Astro y vive servido
estáticamente desde Donweb/Ferozo. Datos de alumnos y contactos
(1.262 personas) viven en Supabase. Email transaccional via Resend
con dominio propio verificado.

Para entender cómo funciona toda la infraestructura, leer `docs/arquitectura.md`.
Para ver qué se hizo y qué falta, leer `docs/PENDIENTES.md`.
Para deployar cambios, leer `docs/guias/deploy.md`.

## Estructura del repositorio

El repo es un monorepo con todo lo del proyecto junto:

```
TMyH/
├── docs/                  Documentación interna
│   ├── arquitectura.md    Cómo está montada toda la infra (leer primero)
│   ├── PENDIENTES.md      Roadmap y decisiones tomadas
│   ├── plan-migracion.md  Histórico de la migración WP → Astro
│   ├── migrations/        Migraciones SQL de Supabase (001 a 009)
│   └── guias/             Guías paso a paso (deploy, panel, Resend...)
│
├── scripts/               Scripts Python de migración de datos
│
├── supabase/
│   └── functions/
│       └── notificar-mensaje-contacto/   Edge Function que avisa por
│                                         mail cuando llega una consulta
│
├── tmyh-web/              Sitio Astro (frontend)
│   ├── src/               Código fuente
│   └── public/            Assets estáticos
│
└── deploy.ps1             Script de deploy: build + push a production
```

## Stack

- Frontend: [Astro 5](https://astro.build) con TypeScript estricto y
  Tailwind CSS 4. Sitio estático compilado.
- Base de datos y autenticación: [Supabase](https://supabase.com)
  (Postgres con RLS).
- Email transaccional: [Resend](https://resend.com) con dominio
  `tradicionmisticayhermetica.com` verificado.
- Hosting: [Donweb / Ferozo](https://donweb.com), sirve archivos
  estáticos compilados.
- Versionado: GitHub bajo la cuenta `tradicionmisticayhermetica-web`,
  repos privados.

## Deploy

Hay dos ramas en GitHub. La rama `main` tiene el código fuente
completo (este repo). La rama `production` tiene únicamente el sitio
ya compilado en su raíz; es la rama que pulea Ferozo.

Para deployar un cambio: hacer los cambios en `main`, commitear y
pushear, y después correr `.\deploy.ps1` desde la raíz del proyecto.
El script compila Astro con la base correcta y empuja el resultado a
la rama `production`. Después, en el panel de Ferozo
(`Mi Sitio Web → GIT`), apretar "Sincronizar" para que el hosting
baje los cambios y los pise en `public_html/`.

Detalle completo en `docs/guias/deploy.md`.

## Comandos útiles

Desarrollo local:

```powershell
cd tmyh-web
npm install        # solo la primera vez
npm run dev        # servidor en http://localhost:4321
```

Build local (sin deploy):

```powershell
cd tmyh-web
npm run build      # genera tmyh-web/dist/
npm run preview    # previsualiza el build local
```

Deploy completo (build + push a production):

```powershell
.\deploy.ps1
```

## Variables de entorno

El sitio frontend necesita dos variables que viven en `tmyh-web/.env`
(no committeado, plantilla en `tmyh-web/.env.example`):

```
PUBLIC_SUPABASE_URL=https://...
PUBLIC_SUPABASE_ANON_KEY=...
```

Las edge functions usan secrets gestionados por el CLI de Supabase
(`npx supabase secrets set NOMBRE=valor`), no vienen del `.env` del
frontend. Los secrets actuales son `RESEND_API_KEY`, `EMAIL_FROM` y
`EMAIL_TO`.

## Acceso

El repositorio es privado. Para colaborar hace falta tener acceso a la
cuenta `tradicionmisticayhermetica-web` o estar agregado como
collaborator. Cada commit firmado en este repo aparece atribuido a la
cuenta institucional, no a desarrolladores individuales.
