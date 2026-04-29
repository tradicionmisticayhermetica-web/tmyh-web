/**
 * Resolución dinámica de imágenes del proyecto.
 *
 * Astro necesita que las imágenes optimizadas con `<Image>` vengan de un
 * import estático. Como en `cursos.ts` y `posts.ts` guardamos solo el
 * nombre de archivo como string, acá creamos un mapa con todas las
 * imágenes de `src/assets/images/` que podemos resolver por nombre.
 *
 * Uso típico en una página Astro:
 *
 *   import { resolverImagen } from "../lib/images";
 *   const img = await resolverImagen(curso.imagen);
 *   { img && <Image src={img} alt={curso.imagenAlt ?? ""} /> }
 */

import type { ImageMetadata } from "astro";

const imagenesGlob = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/images/*.{jpeg,jpg,png,gif,webp,avif}",
);

/**
 * Devuelve el `ImageMetadata` correspondiente al nombre de archivo dado,
 * o `undefined` si no existe.
 */
export async function resolverImagen(
  nombreArchivo: string | undefined,
): Promise<ImageMetadata | undefined> {
  if (!nombreArchivo) return undefined;
  const clave = `/src/assets/images/${nombreArchivo}`;
  const cargador = imagenesGlob[clave];
  if (!cargador) return undefined;
  const mod = await cargador();
  return mod.default;
}
