import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://www.tradicionmisticayhermetica.com",

  // Si Ferozo sirve este repo dentro de public_html/tmyh-web/
  // cambiar base a "/tmyh-web/" mientras haga de preview, y volver a "/" al cutover.
  base: "/",

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