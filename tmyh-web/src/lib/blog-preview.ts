/** Vista previa del post: datos guardados en sessionStorage y página /area-reservada/blog/preview */

export const BLOG_PREVIEW_STORAGE_KEY = "tmyh_blog_preview_v1";

export type BlogPreviewPayload = {
  titulo: string;
  extracto: string | null;
  contenido_html: string;
  etiquetas: string[];
};

export function guardarVistaPreviaYAbrir(payload: BlogPreviewPayload) {
  sessionStorage.setItem(BLOG_PREVIEW_STORAGE_KEY, JSON.stringify(payload));
  const base = String(import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  const url = `${base}/area-reservada/blog/preview`;
  window.open(url, "_blank", "noopener,noreferrer");
}
