# Tradición Mística y Hermética — sitio web

Repositorio del sitio nuevo de **Tradición Mística y Hermética**
([tradicionmisticayhermetica.com](https://www.tradicionmisticayhermetica.com))
y de toda la infraestructura asociada (migraciones de base, edge functions,
scripts de migración de datos, documentación interna).

## Estructura del repo

```
TMyH/
├── docs/                  Documentación interna del proyecto
│   ├── PENDIENTES.md      Roadmap y decisiones tomadas
│   ├── plan-migracion.md  Plan de migración WP → Astro + Supabase
│   ├── migrations/        Migraciones SQL de Supabase (orden numérico)
│   └── guias/             Guías paso a paso (Resend, panel admin, etc.)
│
├── scripts/               Scripts Python para migraciones de datos
│
├── supabase/
│   └── functions/
│       └── notificar-mensaje-contacto/   Edge Function (Deno)
│
└── tmyh-web/              Sitio Astro (frontend)
    ├── src/               Código fuente
    └── public/            Assets estáticos
```

## Stack

- **Frontend**: [Astro 5](https://astro.build) + TypeScript + Tailwind CSS 4.
- **Base de datos / Auth**: [Supabase](https://supabase.com) (Postgres + Auth + RLS).
- **Email transaccional**: [Resend](https://resend.com).
- **Hosting**: Donweb / Ferozo (sirve archivos estáticos compilados).

## Comandos

Desarrollo local:

```powershell
cd tmyh-web
npm install        # solo la primera vez
npm run dev        # http://localhost:4321
```

Build:

```powershell
cd tmyh-web
npm run build      # genera tmyh-web/dist/
npm run preview    # previsualiza el build local
```

## Estrategia de deploy

- Rama `main`: source code completo (este repo, todo lo de arriba).
- Rama `production`: **solo** el contenido de `tmyh-web/dist/` ya compilado, en
  el root. **Es la rama que pulea Ferozo** y la única expuesta al dominio
  público.
- Para deployar: ver `docs/guias/deploy.md` (próximamente). Resumen:
  `npm run build` → push de `dist/` a `production` → `git pull` desde Ferozo.

Esto mantiene los `docs/`, `scripts/` y `supabase/functions/` accesibles solo
desde el repo privado (donde tienen que estar para versionarlos), y publica
en el dominio únicamente el sitio compilado.

## Variables de entorno

- `tmyh-web/.env` (no committeado): variables del frontend (Supabase URL +
  anon key). Plantilla en `tmyh-web/.env.example`.
- Edge Functions: secrets gestionados con `npx supabase secrets set` (no
  vienen de `.env`).

## Estado actual

Ver `docs/PENDIENTES.md` para el roadmap detallado y las decisiones tomadas.

---

Repo privado. Solo se difunde a personas explícitamente invitadas.
