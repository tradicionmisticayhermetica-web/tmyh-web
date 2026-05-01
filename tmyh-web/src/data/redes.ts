// =============================================================================
// Redes sociales y canales de contacto: fuente unica de verdad
// =============================================================================
// Si en el futuro Emanuel cambia el numero de WhatsApp, abre una cuenta de
// otra red, o desactiva alguna, este es el unico archivo a tocar. Lo
// importan footer, /contacto, /tradicion y el JSON-LD del BaseLayout.
//
// Convenciones:
//   - URLs absolutas con https.
//   - WhatsApp se guarda como string "5491165008996" (sin '+', sin espacios)
//     porque ese es el formato que pide la URL `wa.me/<numero>`.
// =============================================================================

export interface RedSocial {
  /** Identificador del canal: usado como `key` en componentes y para tracking. */
  id: "instagram" | "facebook" | "whatsapp";
  /** Nombre legible para mostrar en aria-label / tooltip. */
  nombre: string;
  /** URL canonica del perfil/chat. */
  url: string;
  /** Texto corto que describe el canal (visible en variantes "destacadas"). */
  cta?: string;
}

/**
 * Numero de WhatsApp oficial de la escuela. Mismo numero que aparece en los
 * datos de inscripcion de cursos (`data/cursos.ts` -> `inscripcionComun`).
 *
 * IMPORTANTE: si cambia el numero, actualizar TAMBIEN `inscripcionComun` en
 * `src/data/cursos.ts`. Despues podemos migrar todo a este archivo.
 */
export const WHATSAPP_NUMERO = "5491165008996";

/** Formateo visual del numero (no-breaking spaces para que no se parta). */
export const WHATSAPP_NUMERO_VISUAL = "+54 9 11 6500 8996";

/** Mensaje pre-cargado al abrir un chat de WhatsApp desde el sitio. */
export const WHATSAPP_MENSAJE_DEFAULT =
  "Hola! Estoy mirando la pagina de Tradición Mística y Hermética y me gustaría hacerles una consulta.";

/** URL completa para abrir WhatsApp con mensaje pre-cargado. */
export function urlWhatsApp(mensaje: string = WHATSAPP_MENSAJE_DEFAULT): string {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Lista canonica de redes oficiales de la escuela. El orden importa: es el
 * orden en que aparecen los iconos en el footer y la pagina de contacto.
 *
 * Para perfiles personales (ej. Instagram de Emanuel `emanuelmari79`), usar
 * directamente la URL en la pagina especifica donde aplique (`/tradicion`).
 */
export const REDES_OFICIALES: RedSocial[] = [
  {
    id: "instagram",
    nombre: "Instagram",
    url: "https://www.instagram.com/tradicionmisticayhermetica/",
    cta: "Seguinos en Instagram",
  },
  {
    id: "facebook",
    nombre: "Facebook",
    url: "https://www.facebook.com/tradicionmisticayhermetica/",
    cta: "Encontranos en Facebook",
  },
  {
    id: "whatsapp",
    nombre: "WhatsApp",
    url: urlWhatsApp(),
    cta: "Escribinos por WhatsApp",
  },
];
