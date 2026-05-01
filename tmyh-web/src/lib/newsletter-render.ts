/**
 * Render del HTML de un email de newsletter.
 *
 * IMPORTANTE: este archivo se mantiene como TS PURO sin imports externos
 * para que pueda compartirse entre:
 *   - el navegador (página de vista previa /area-reservada/newsletter/preview)
 *   - Deno (Supabase Edge Functions: envío de prueba y worker masivo)
 *
 * Si necesitás modificarlo, también copialo a:
 *   supabase/functions/_shared/newsletter-render.ts
 *
 * El estilo es inline (no <style>) porque los clientes de email descartan
 * o reescriben CSS externo. Está pensado para Gmail, Outlook, Apple Mail.
 */

// =============================================================================
// Tipos públicos
// =============================================================================

export interface PostParaEmail {
  titulo: string;
  slug: string;
  extracto?: string | null;
  imagen_destacada?: string | null;
  publicado_en?: string | null;
}

export interface OpcionesRenderEmail {
  asunto: string;
  introHtml?: string | null;
  imagenDestacada?: string | null;
  posts: PostParaEmail[];
  /** URL absoluta del sitio (sin barra final). Ej: https://www.tradicionmisticayhermetica.com */
  baseSitio: string;
  /**
   * Token UUID del contacto para el link de baja.
   * Si no se pasa, se muestra un placeholder (útil en preview cuando todavía
   * no se generó la fila de envío).
   */
  tokenUnsubscribe?: string | null;
  /** Nombre del destinatario (para el saludo opcional). */
  nombreDestinatario?: string | null;
  /** Si true, marca el email como "vista previa" en el footer. */
  esPreview?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fechaCorta(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Limpia HTML de Tiptap para inlinear estilos básicos en el email.
 * Convierte clases del editor en estilos inline y elimina elementos
 * que rompen en clientes de mail (script, iframe sin attrs, etc.).
 *
 * No es una sanitización completa: confía en el editor admin (no es
 * input de usuario público).
 */
function transformarIntroHtml(html: string): string {
  if (!html) return "";

  let out = html;

  // Headings: aplicar tipografía display + color según nivel
  out = out.replace(
    /<h2(\s[^>]*)?>/gi,
    '<h2 style="font-family:Georgia,serif;font-size:22px;color:#f5ecd7;margin:32px 0 12px 0;line-height:1.3;font-weight:500;letter-spacing:0.5px;">',
  );
  out = out.replace(
    /<h3(\s[^>]*)?>/gi,
    '<h3 style="font-family:Georgia,serif;font-size:18px;color:#e6c464;margin:24px 0 10px 0;font-weight:500;">',
  );

  // Párrafos
  out = out.replace(
    /<p(\s[^>]*)?>/gi,
    '<p style="font-family:Georgia,serif;font-size:17px;line-height:1.7;color:#ede2c4;margin:0 0 18px 0;">',
  );

  // Blockquote
  out = out.replace(
    /<blockquote(\s[^>]*)?>/gi,
    '<blockquote style="border-left:2px solid #d4af37;padding:8px 0 8px 20px;margin:20px 0;font-style:italic;color:#b8a984;">',
  );

  // Listas
  out = out.replace(
    /<ul(\s[^>]*)?>/gi,
    '<ul style="margin:0 0 18px 0;padding-left:24px;color:#ede2c4;font-family:Georgia,serif;font-size:17px;line-height:1.7;">',
  );
  out = out.replace(
    /<ol(\s[^>]*)?>/gi,
    '<ol style="margin:0 0 18px 0;padding-left:24px;color:#ede2c4;font-family:Georgia,serif;font-size:17px;line-height:1.7;">',
  );
  out = out.replace(/<li(\s[^>]*)?>/gi, '<li style="margin:0 0 6px 0;">');

  // Imágenes
  out = out.replace(
    /<img(\s[^>]*)>/gi,
    '<img$1 style="max-width:100%;height:auto;border-radius:2px;display:block;margin:18px auto;border:0;">',
  );

  // Links
  out = out.replace(
    /<a(\s[^>]*?)>/gi,
    '<a$1 style="color:#e6c464;text-decoration:underline;text-underline-offset:2px;">',
  );

  // Bold
  out = out.replace(
    /<strong(\s[^>]*)?>/gi,
    '<strong style="color:#f5ecd7;font-weight:600;">',
  );

  // Hr (separador con sol)
  out = out.replace(
    /<hr\s*\/?>/gi,
    '<div style="text-align:center;margin:32px 0;color:#d4af37;opacity:0.6;font-size:18px;">☉</div>',
  );

  return out;
}

/**
 * Renderiza una "card" de post para el email, con el mismo look del sitio
 * (fondo oscuro, oro como acento, separador con ornamento).
 */
function renderPostCard(post: PostParaEmail, baseSitio: string): string {
  const url = `${baseSitio.replace(/\/$/, "")}/blog/post?slug=${encodeURIComponent(post.slug)}`;
  const titulo = escapeHtml(post.titulo);
  const extracto = post.extracto ? escapeHtml(post.extracto) : "";
  const fecha = fechaCorta(post.publicado_en);

  const imagenHtml = post.imagen_destacada
    ? `<a href="${url}" style="text-decoration:none;display:block;">
        <img src="${escapeHtml(post.imagen_destacada)}" alt="${titulo}" width="540"
             style="width:100%;max-width:540px;height:auto;display:block;border:0;border-radius:2px;margin-bottom:16px;" />
      </a>`
    : "";

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin:0 0 36px 0;">
      <tr>
        <td>
          ${imagenHtml}
          ${
            fecha
              ? `<div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8b7e5d;margin-bottom:8px;">${escapeHtml(fecha)}</div>`
              : ""
          }
          <h2 style="font-family:Georgia,serif;font-size:24px;color:#f5ecd7;margin:0 0 12px 0;line-height:1.25;font-weight:500;">
            <a href="${url}" style="color:#f5ecd7;text-decoration:none;">${titulo}</a>
          </h2>
          ${
            extracto
              ? `<p style="font-family:Georgia,serif;font-size:16px;font-style:italic;line-height:1.6;color:#b8a984;margin:0 0 16px 0;">${extracto}</p>`
              : ""
          }
          <a href="${url}"
             style="display:inline-block;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#e6c464;text-decoration:none;border:1px solid rgba(212,175,55,0.4);padding:8px 18px;border-radius:2px;">
            Leer reflexión →
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Devuelve la URL del link de baja para un contacto. Si no hay token,
 * devuelve la página de preferencias sin token (informativa).
 */
export function urlUnsubscribe(
  baseSitio: string,
  tokenUnsubscribe?: string | null,
): string {
  const base = baseSitio.replace(/\/$/, "");
  if (!tokenUnsubscribe) return `${base}/newsletter/preferencias`;
  return `${base}/newsletter/preferencias?token=${encodeURIComponent(tokenUnsubscribe)}`;
}

// =============================================================================
// Render principal
// =============================================================================

/**
 * Devuelve el HTML completo del email listo para mandar a Resend.
 * Mismo look & feel del sitio: night-950 + oro + serif.
 */
export function renderEmailHtml(opts: OpcionesRenderEmail): string {
  const asunto = escapeHtml(opts.asunto || "Tradición Mística y Hermética");
  const introHtml = opts.introHtml ? transformarIntroHtml(opts.introHtml) : "";
  const cardsPosts = opts.posts.map((p) => renderPostCard(p, opts.baseSitio)).join("\n");
  const tieneIntro = introHtml.trim().length > 0;
  const tienePosts = opts.posts.length > 0;
  const linkBaja = urlUnsubscribe(opts.baseSitio, opts.tokenUnsubscribe);
  const linkSitio = opts.baseSitio.replace(/\/$/, "");
  const saludo = opts.nombreDestinatario
    ? `<p style="font-family:Georgia,serif;font-size:17px;color:#ede2c4;margin:0 0 18px 0;">Hola, ${escapeHtml(opts.nombreDestinatario)}.</p>`
    : "";

  const imagenCabeceraHtml = opts.imagenDestacada
    ? `<tr>
        <td>
          <img src="${escapeHtml(opts.imagenDestacada)}" alt="" width="600"
               style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
        </td>
      </tr>`
    : "";

  const bannerPreview = opts.esPreview
    ? `<div style="background:#3a2a14;color:#f5ecd7;padding:8px 16px;text-align:center;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid rgba(212,175,55,0.3);">
        Vista previa · Este es solo un render local · No se envió a nadie
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${asunto}</title>
</head>
<body style="margin:0;padding:0;background:#07060d;font-family:Georgia,serif;color:#ede2c4;-webkit-font-smoothing:antialiased;">

${bannerPreview}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
       style="background:#07060d;">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
             style="width:600px;max-width:600px;background:#0b0a12;border:1px solid rgba(230,196,100,0.14);">

        ${imagenCabeceraHtml}

        <!-- Cabecera -->
        <tr>
          <td style="padding:32px 32px 12px 32px;text-align:center;border-bottom:1px solid rgba(230,196,100,0.12);">
            <div style="font-size:24px;color:#d4af37;line-height:1;margin-bottom:10px;">☉</div>
            <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:5px;color:#f5ecd7;text-transform:uppercase;font-weight:500;">
              Tradición Mística y Hermética
            </div>
          </td>
        </tr>

        <!-- Asunto como titular -->
        <tr>
          <td style="padding:36px 32px 8px 32px;">
            <h1 style="font-family:Georgia,serif;font-size:28px;color:#f5ecd7;margin:0 0 8px 0;line-height:1.25;font-weight:500;letter-spacing:0.3px;">
              ${asunto}
            </h1>
          </td>
        </tr>

        ${
          tieneIntro
            ? `<!-- Introducción rica (Tiptap) -->
        <tr>
          <td style="padding:8px 32px 20px 32px;">
            ${saludo}
            ${introHtml}
          </td>
        </tr>`
            : ""
        }

        ${
          tienePosts && tieneIntro
            ? `<tr>
                <td style="padding:0 32px;">
                  <div style="text-align:center;color:#d4af37;opacity:0.6;font-size:18px;margin:8px 0 24px 0;">☉</div>
                </td>
              </tr>`
            : ""
        }

        ${
          tienePosts
            ? `<!-- Posts seleccionados -->
        <tr>
          <td style="padding:8px 32px 16px 32px;">
            ${cardsPosts}
          </td>
        </tr>`
            : ""
        }

        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px 32px 32px;border-top:1px solid rgba(230,196,100,0.12);text-align:center;">
            <div style="font-family:Georgia,serif;font-size:13px;font-style:italic;color:#b8a984;margin-bottom:14px;">
              Recibís este boletín porque te suscribiste en
              <a href="${linkSitio}" style="color:#e6c464;text-decoration:none;">tradicionmisticayhermetica.com</a>.
            </div>
            <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.5px;color:#8b7e5d;text-transform:uppercase;">
              <a href="${linkBaja}" style="color:#8b7e5d;text-decoration:underline;">Darme de baja del newsletter</a>
              &nbsp;·&nbsp;
              <a href="${linkSitio}" style="color:#8b7e5d;text-decoration:underline;">Ir al sitio</a>
            </div>
            <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:1px;color:#5a5142;margin-top:18px;">
              © Tradición Mística y Hermética
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}

/**
 * Versión texto plano (fallback para clientes que no leen HTML).
 * Resend la usa automáticamente como `text` cuando solo se manda `html`,
 * pero generarla nosotros mejora la accesibilidad y reduce filtros de spam.
 */
export function renderEmailTexto(opts: OpcionesRenderEmail): string {
  const linkBaja = urlUnsubscribe(opts.baseSitio, opts.tokenUnsubscribe);
  const baseSitio = opts.baseSitio.replace(/\/$/, "");

  const intro = opts.introHtml
    ? opts.introHtml
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";

  const lineas: string[] = [];
  lineas.push(opts.asunto);
  lineas.push("=".repeat(Math.min(opts.asunto.length, 60)));
  lineas.push("");
  if (opts.nombreDestinatario) {
    lineas.push(`Hola, ${opts.nombreDestinatario}.`);
    lineas.push("");
  }
  if (intro) {
    lineas.push(intro);
    lineas.push("");
  }
  if (opts.posts.length > 0) {
    lineas.push("---");
    lineas.push("");
    for (const p of opts.posts) {
      lineas.push(p.titulo);
      if (p.extracto) lineas.push(p.extracto);
      lineas.push(
        `${baseSitio}/blog/post?slug=${encodeURIComponent(p.slug)}`,
      );
      lineas.push("");
    }
  }
  lineas.push("---");
  lineas.push(
    "Recibís este boletín porque te suscribiste en " + baseSitio + ".",
  );
  lineas.push(`Darme de baja: ${linkBaja}`);

  return lineas.join("\n");
}
