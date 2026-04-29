# tmyh-web

Sitio nuevo de **Tradición Mística y Hermética** —
[tradicionmisticayhermetica.com](https://www.tradicionmisticayhermetica.com).

Este es solo el subdirectorio del sitio Astro. Para la documentación
completa del proyecto (arquitectura, infraestructura, plan de deploy)
ver el README y los docs en la raíz del repo (`../README.md`,
`../docs/arquitectura.md`).

## Stack

- [Astro 5](https://astro.build) (static site generator)
- TypeScript estricto
- [Tailwind CSS 4](https://tailwindcss.com/)
- Sitio puramente estático: el resultado del build son archivos HTML,
  CSS, JS e imágenes optimizadas. No requiere Node ni PHP en el server.

## Comandos

```bash
npm install       # solo la primera vez
npm run dev       # servidor local en http://localhost:4321
npm run build     # genera dist/
npm run preview   # previsualiza el build local
```

## Estructura

```text
src/
├── components/        piezas reutilizables (Navbar, Footer, CourseCard, ...)
├── data/              datos estáticos (lista de cursos)
├── layouts/           layouts base de páginas (BaseLayout, AdminLayout)
├── lib/               clientes y helpers (supabase, auth, admin)
├── pages/             rutas del sitio
│   ├── index.astro              home
│   ├── cursos/                  listado y detalle de cursos
│   ├── blog/                    blog (hoy con posts hardcodeados)
│   ├── area-reservada/          panel admin (login required)
│   ├── tradicion.astro          página "La Tradición"
│   └── contacto.astro
└── styles/            tokens + global.css
public/                assets estáticos (favicon, og-image, robots)
```

## Cómo agregar un curso nuevo

Editar `src/data/cursos.ts` y agregar un objeto al array. Se crea
automáticamente la página `/cursos/<slug>` con el detalle del curso.

## Variables de entorno

Crear `.env` (no committeado) con:

```
PUBLIC_SUPABASE_URL=https://....supabase.co
PUBLIC_SUPABASE_ANON_KEY=...
```

Plantilla en `.env.example`.

## Deploy

El deploy se hace desde la raíz del monorepo, no desde acá. El proceso
está documentado en `../docs/guias/deploy.md` y resumido en
`../README.md`. En síntesis: `.\deploy.ps1` desde la raíz hace build y
push a la rama `production` de GitHub; después en Ferozo se hace
"Sincronizar" para que el hosting pulee la rama y los archivos
queden servidos.
