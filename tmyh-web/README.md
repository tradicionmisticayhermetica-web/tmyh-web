# tmyh-web

Sitio nuevo de **Tradición Mística y Hermética** — reemplazo del viejo WordPress
en [tradicionmisticayhermetica.com](https://www.tradicionmisticayhermetica.com).

## Stack

- [Astro 5](https://astro.build) (static site generator)
- TypeScript estricto
- [Tailwind CSS 4](https://tailwindcss.com/)
- Deploy: Ferozo (vía `git pull` del repo, sirve `dist/` compilado)

## Comandos

```bash
npm install       # una vez
npm run dev       # servidor local en http://localhost:4321
npm run build     # genera dist/ (esto se committea y Ferozo lo sirve)
npm run preview   # previsualiza el build local
```

## Estructura

```text
src/
├── components/        piezas reutilizables (Navbar, Footer, CourseCard, ...)
├── data/              datos estáticos (lista de cursos)
├── layouts/           layouts base de páginas
├── pages/             rutas del sitio
│   ├── index.astro              home
│   ├── cursos/
│   │   ├── index.astro          listado de cursos
│   │   └── [slug].astro         detalle de cada curso
│   ├── sobre-mi.astro
│   └── contacto.astro
├── styles/            tokens + global.css
└── utils/             helpers
public/                assets estáticos (favicon, imágenes)
```

## Cómo agregar un curso nuevo

Editar `src/data/cursos.ts` y agregar un objeto al array. Se crea
automáticamente la página `/cursos/<slug>`.

## Deploy

1. `npm run build` → genera `dist/`.
2. `git add dist/ && git commit -m "build: ..."` → committear.
3. `git push` → GitHub.
4. En Ferozo: "Actualizar" el repo → hace `git pull` → sitio actualizado.
