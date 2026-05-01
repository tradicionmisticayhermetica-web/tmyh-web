// =============================================================================
// Edge Function: resend-eventos (webhook de Resend)
// =============================================================================
// Endpoint publico que Resend invoca cada vez que ocurre un evento sobre un
// email que mandamos. Recibimos `email.delivered`, `email.opened`,
// `email.bounced`, `email.complained` y los registramos via la RPC
// `newsletter_registrar_evento_resend`.
//
// Seguridad: validamos la firma HMAC del webhook (formato Svix) usando un
// secret que Resend nos da al crear el endpoint. Sin esto, cualquiera podria
// mandar eventos falsos a esta URL.
//
// Resend reintenta si no recibimos respuesta 2xx. Por eso siempre devolvemos
// 200 cuando podemos parsear el evento, incluso si el envio no se encuentra
// en nuestra base (porque podria ser de una campana ya borrada o de antes
// de que existiera el tracking).
//
// DEPLOY:
//   npx supabase functions deploy resend-eventos --no-verify-jwt
//
// Variables de entorno requeridas:
//   RESEND_WEBHOOK_SECRET    whsec_xxx... (Resend Dashboard -> Webhooks -> Signing Secret)
//   SUPABASE_URL             se inyecta automaticamente.
//   SUPABASE_SERVICE_ROLE_KEY se inyecta automaticamente.
//
// Configuracion en Resend:
//   Dashboard -> Webhooks -> Add endpoint
//     - URL: https://<proyecto>.supabase.co/functions/v1/resend-eventos
//     - Eventos: email.delivered, email.opened, email.bounced, email.complained
//   Despues copiar el "Signing Secret" (whsec_...) y guardarlo como
//   RESEND_WEBHOOK_SECRET en Supabase -> Edge Functions -> Manage secrets.
// =============================================================================

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// =============================================================================
// Config
// =============================================================================
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET");

// Tolerancia (en segundos) para el timestamp del webhook. Resend usa Svix,
// que recomienda 5 min para evitar replays.
const TOLERANCIA_TIMESTAMP_SEG = 5 * 60;

// =============================================================================
// Helpers de log
// =============================================================================
function log(...args: any[]) {
  console.log("[resend-eventos]", ...args);
}
function logError(...args: any[]) {
  console.error("[resend-eventos]", ...args);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// =============================================================================
// Verificación HMAC (formato Svix, que es lo que usa Resend)
// =============================================================================
//
// Spec: https://docs.svix.com/receiving/verifying-payloads/how-manual
//
// Headers que manda Resend:
//   svix-id          id unico del webhook
//   svix-timestamp   timestamp unix
//   svix-signature   "v1,<base64-signature> v1,<base64-signature-2> ..."
//
// El contenido a firmar es: `${svix_id}.${svix_timestamp}.${body}` con HMAC
// SHA-256, usando como clave los bytes decodificados del secret (base64
// despues de quitar el prefijo `whsec_`).
//
// Validamos que al menos UNA de las firmas en svix-signature coincida con
// la calculada localmente. Tambien rechazamos eventos con timestamp > 5min
// del actual (replay attacks).
async function verificarFirmaResend(
  req: Request,
  body: string,
  secret: string,
): Promise<{ ok: boolean; motivo?: string }> {
  const svixId = req.headers.get("svix-id") ?? req.headers.get("webhook-id");
  const svixTimestamp =
    req.headers.get("svix-timestamp") ?? req.headers.get("webhook-timestamp");
  const svixSignature =
    req.headers.get("svix-signature") ?? req.headers.get("webhook-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return { ok: false, motivo: "faltan_headers_svix" };
  }

  const tsNum = parseInt(svixTimestamp, 10);
  if (!Number.isFinite(tsNum)) {
    return { ok: false, motivo: "timestamp_invalido" };
  }
  const ahora = Math.floor(Date.now() / 1000);
  if (Math.abs(ahora - tsNum) > TOLERANCIA_TIMESTAMP_SEG) {
    return { ok: false, motivo: "timestamp_fuera_de_ventana" };
  }

  const secretLimpio = secret.replace(/^whsec_/, "");
  let secretBytes: Uint8Array;
  try {
    secretBytes = Uint8Array.from(atob(secretLimpio), (c) => c.charCodeAt(0));
  } catch {
    return { ok: false, motivo: "secret_no_es_base64" };
  }

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signedContent = `${svixId}.${svixTimestamp}.${body}`;
  const sigBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedContent),
  );
  const sigEsperada = btoa(
    String.fromCharCode(...new Uint8Array(sigBytes)),
  );

  // El header puede traer multiples firmas separadas por espacio:
  //   "v1,xxxxxx v1,yyyyyy"
  // Validamos que al menos una coincida.
  const firmasRecibidas = svixSignature
    .split(" ")
    .map((s) => s.trim().split(","))
    .filter((parts) => parts.length === 2 && parts[0].startsWith("v1"))
    .map((parts) => parts[1]);

  if (firmasRecibidas.length === 0) {
    return { ok: false, motivo: "sin_firmas_v1" };
  }

  // Comparacion en tiempo constante (mejor para HMAC).
  const enc = new TextEncoder();
  const expectedBytes = enc.encode(sigEsperada);
  const matches = firmasRecibidas.some((f) => {
    const fb = enc.encode(f);
    if (fb.length !== expectedBytes.length) return false;
    let diff = 0;
    for (let i = 0; i < fb.length; i++) diff |= fb[i] ^ expectedBytes[i];
    return diff === 0;
  });

  if (!matches) return { ok: false, motivo: "firma_no_coincide" };
  return { ok: true };
}

// =============================================================================
// Despacho del evento al RPC
// =============================================================================
async function registrarEvento(payload: any): Promise<unknown> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Resend manda { type: "email.delivered", data: { email_id, ... }, created_at }
  const tipoCompleto: string | undefined = payload?.type;
  if (!tipoCompleto || typeof tipoCompleto !== "string") {
    return { ok: false, error: "evento_sin_type" };
  }

  // Quitamos el prefijo "email." para que la RPC reciba 'delivered', etc.
  const tipo = tipoCompleto.replace(/^email\./, "");

  const resendId: string | undefined = payload?.data?.email_id;
  if (!resendId) {
    return { ok: false, error: "evento_sin_email_id" };
  }

  const { data, error } = await supabase.rpc(
    "newsletter_registrar_evento_resend",
    {
      p_resend_id: resendId,
      p_tipo: tipo,
      p_payload: payload,
    },
  );

  if (error) {
    logError(`RPC newsletter_registrar_evento_resend fallo:`, error.message);
    return { ok: false, error: "rpc_error", detalle: error.message };
  }

  return data;
}

// =============================================================================
// Handler HTTP
// =============================================================================
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "metodo_no_permitido" }, 405);
  }

  // Leemos el body como texto crudo (necesario para verificar la firma).
  let bodyTexto: string;
  try {
    bodyTexto = await req.text();
  } catch (err) {
    logError("No pude leer body:", err);
    return jsonResponse({ ok: false, error: "body_ilegible" }, 400);
  }

  // Verificacion de firma: solo si tenemos secret configurado. Sin secret,
  // rechazamos por seguridad (la function no se podria considerar publica
  // sin esa proteccion).
  if (!RESEND_WEBHOOK_SECRET) {
    logError("RESEND_WEBHOOK_SECRET no configurado. Rechazando webhook.");
    return jsonResponse(
      { ok: false, error: "webhook_secret_no_configurado" },
      503,
    );
  }

  const verif = await verificarFirmaResend(req, bodyTexto, RESEND_WEBHOOK_SECRET);
  if (!verif.ok) {
    logError("Firma invalida:", verif.motivo);
    return jsonResponse(
      { ok: false, error: "firma_invalida", motivo: verif.motivo },
      401,
    );
  }

  // Parseamos el JSON
  let payload: any;
  try {
    payload = JSON.parse(bodyTexto);
  } catch (err) {
    logError("Body no es JSON:", err);
    return jsonResponse({ ok: false, error: "body_no_json" }, 400);
  }

  log(`Evento ${payload?.type ?? "?"} recibido para ${payload?.data?.email_id ?? "?"}`);

  try {
    const resultado = await registrarEvento(payload);
    return jsonResponse(resultado);
  } catch (err) {
    logError("Excepcion procesando evento:", err);
    // 200 para que Resend no reintente indefinidamente; el error queda en logs.
    return jsonResponse(
      { ok: false, error: "excepcion", detalle: String(err) },
      200,
    );
  }
});
