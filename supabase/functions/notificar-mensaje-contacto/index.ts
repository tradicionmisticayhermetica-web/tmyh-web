// =============================================================================
// Edge Function: notificar-mensaje-contacto
// =============================================================================
// Se dispara con un Database Webhook de Supabase cada vez que se inserta una
// fila en `public.mensajes_contacto`. Envia un email a Emanuel via Resend
// con los datos estructurados del mensaje. El campo Reply-To del mail apunta
// al email del visitante, asi cuando Emanuel hace "Reply" en Gmail, su
// respuesta sale directamente al visitante sin pasar por ningun intermedio.
//
// DEPLOY (cuando tengas Resend y dominio listos):
//
//   npx supabase functions deploy notificar-mensaje-contacto --no-verify-jwt
//
// Variables de entorno requeridas (Supabase Dashboard -> Edge Functions ->
// Settings o via `supabase secrets set`):
//
//   RESEND_API_KEY       re_xxxxx... (generar en resend.com)
//   EMAIL_FROM           "Tradicion Mistica y Hermetica <contacto@tradicionmisticayhermetica.com>"
//   EMAIL_TO             tradicionmisticayhermetica@gmail.com
//
// Database Webhook (Supabase Dashboard -> Database -> Webhooks):
//   - Trigger: public.mensajes_contacto, Events: Insert
//   - Type: Supabase Edge Function
//   - Function: notificar-mensaje-contacto
//   - HTTP Headers: (no son necesarios; Supabase firma el webhook)
//
// Prueba local:
//   supabase functions serve notificar-mensaje-contacto --env-file .env
//   curl -i -X POST http://localhost:54321/functions/v1/notificar-mensaje-contacto \
//     -H "Content-Type: application/json" \
//     -d '{"type":"INSERT","table":"mensajes_contacto","record":{...}}'
// =============================================================================

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck — este archivo corre en Deno (Supabase Edge Runtime), no en Node.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM =
  Deno.env.get("EMAIL_FROM") ??
  "Tradicion Mistica y Hermetica <onboarding@resend.dev>";
// Mandamos al alias `contacto@` (el forwarder de Ferozo lo reenvía al
// Gmail principal).
const EMAIL_TO =
  Deno.env.get("EMAIL_TO") ?? "contacto@tradicionmisticayhermetica.com";

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: MensajeRecord;
  old_record: MensajeRecord | null;
}

interface MensajeRecord {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono: string | null;
  curso_interes: string | null;
  mensaje: string;
  newsletter_optin: boolean;
  user_agent: string | null;
  ip_hash: string | null;
  creado_en: string;
}

function escapeHtml(txt: string): string {
  return txt
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function nombreCompleto(r: MensajeRecord): string {
  return [r.nombre, r.apellido].filter(Boolean).join(" ");
}

function construirHtml(r: MensajeRecord): string {
  const nombre = escapeHtml(nombreCompleto(r));
  const email = escapeHtml(r.email);
  const telefono = r.telefono ? escapeHtml(r.telefono) : "—";
  const curso = r.curso_interes ? escapeHtml(r.curso_interes) : "Sin especificar";
  const mensaje = escapeHtml(r.mensaje).replace(/\n/g, "<br/>");
  const newsletter = r.newsletter_optin ? "Sí" : "No";
  const fecha = new Date(r.creado_en).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0b0a12;font-family:'Cormorant Garamond', Georgia, serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b0a12;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#0b0a12;border:1px solid rgba(230,196,100,0.14);">

          <tr>
            <td style="padding:24px 32px;text-align:center;border-bottom:1px solid rgba(230,196,100,0.12);">
              <div style="font-size:22px;color:#d4af37;line-height:1;margin-bottom:8px;">☉</div>
              <div style="font-family:'Cinzel',Georgia,serif;font-size:11px;letter-spacing:4px;color:#f5ecd7;text-transform:uppercase;">
                Nueva consulta · Tradición Mística y Hermética
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <h1 style="margin:0 0 4px 0;font-family:'Cinzel',Georgia,serif;font-size:22px;font-weight:500;color:#f5ecd7;letter-spacing:0.5px;">
                ${nombre}
              </h1>
              <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-style:italic;color:#b8a984;">
                ${curso}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 32px 24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#ede2c4;">
                <tr>
                  <td width="110" style="padding:8px 0;color:#8b7e5d;letter-spacing:1px;text-transform:uppercase;font-size:11px;vertical-align:top;">Email</td>
                  <td style="padding:8px 0;"><a href="mailto:${email}" style="color:#e6c464;text-decoration:none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#8b7e5d;letter-spacing:1px;text-transform:uppercase;font-size:11px;vertical-align:top;">Teléfono</td>
                  <td style="padding:8px 0;color:#ede2c4;">${telefono}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#8b7e5d;letter-spacing:1px;text-transform:uppercase;font-size:11px;vertical-align:top;">Newsletter</td>
                  <td style="padding:8px 0;color:${r.newsletter_optin ? "#e6c464" : "#8b7e5d"};">${newsletter}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#8b7e5d;letter-spacing:1px;text-transform:uppercase;font-size:11px;vertical-align:top;">Recibido</td>
                  <td style="padding:8px 0;color:#b8a984;font-size:12px;">${fecha}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px;">
              <div style="border-top:1px solid rgba(212,175,55,0.2);"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <div style="font-family:'Inter',Arial,sans-serif;font-size:11px;color:#8b7e5d;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">
                Mensaje
              </div>
              <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;line-height:1.7;color:#ede2c4;background:rgba(230,196,100,0.04);padding:20px;border-left:2px solid #d4af37;">
                ${mensaje}
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 32px 20px 32px;">
              <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-style:italic;color:#b8a984;line-height:1.6;">
                Para responder, usá la opción <strong style="color:#e6c464;font-style:normal;">Responder</strong> de tu cliente de mail.
                <br/>
                La respuesta saldrá directamente a
                <a href="mailto:${email}" style="color:#e6c464;text-decoration:none;border-bottom:1px solid rgba(212,175,55,0.3);">${email}</a>.
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

function construirAsunto(r: MensajeRecord): string {
  const nombre = nombreCompleto(r);
  const curso = r.curso_interes ? ` — ${r.curso_interes}` : "";
  return `Nueva consulta: ${nombre}${curso}`;
}

async function enviarEmailResend(r: MensajeRecord): Promise<Response> {
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "RESEND_API_KEY no configurada",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [EMAIL_TO],
      reply_to: r.email,
      subject: construirAsunto(r),
      html: construirHtml(r),
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("[resend] error:", res.status, data);
    return new Response(
      JSON.stringify({ ok: false, error: "resend_error", detalle: data }),
      { status: res.status, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: true, id: (data as any).id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "json_invalido" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (payload?.type !== "INSERT" || payload?.table !== "mensajes_contacto") {
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: "no es INSERT en mensajes_contacto" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  return await enviarEmailResend(payload.record);
});
