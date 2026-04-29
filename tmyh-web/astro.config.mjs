import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import sitemap from "@astrojs/sitemap";

// El sitio se sirve hoy como preview en `/tmyh-web/` (WordPress sigue en root).
// Cuando hagamos el cutover (Fase 6 del plan-migracion), pasamos a "/".
//
// Para no afectar el dev local, el base se decide por variable de entorno:
//   - npm run dev (sin BASE_PATH) → "/"  (URL local: http://localhost:4321/)
//   - npm run build BASE_PATH=/tmyh-web/ → "/tmyh-web/" (URL prod actual)
//   - npm run build BASE_PATH=/         → "/" (URL prod después del cutover)
const basePath = process.env.BASE_PATH || "/";

// https://astro.build/config
export default defineConfig({
  site: "https://www.tradicionmisticayhermetica.com",

  base: basePath,

  trailingSlash: "ignore",

  build: {
    inlineStylesheets: "auto",
  },

  server: {
    // Permitir que accedan desde cualquier host (ej. tuneles Cloudflare para previsualizar)
    host: true,
    allowedHosts: true,
  },

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,
    },
  },

  integrations: [sitemap()],
});