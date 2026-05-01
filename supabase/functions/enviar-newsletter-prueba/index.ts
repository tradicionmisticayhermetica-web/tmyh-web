// =============================================================================
// Edge Function: enviar-newsletter-prueba
// =============================================================================
// Envía UN email de prueba con el HTML completo de una campaña a una dirección
// puntual. Sin tocar `newsletter_envios` ni cambiar el estado de la campaña.
//
// Sirve para que el admin valide cómo se ve el email antes de encolar el
// envío masivo. La pieza que mandará a todos los suscriptores se llama
// `procesar-newsletter-cola` (Bloque 3) y compartirá el render con esta.
//
// DEPLOY:
//   npx supabase functions deploy enviar-newsletter-prueba --no-verify-jwt
//
// La función verifica que quien la llama sea admin (vía es_admin() en BD).
// No la dejamos public.
//
// Variables de entorno requeridas (ya configuradas para
// notificar-mensaje-contacto):
//   RESEND_API_KEY           re_xxxxx...
//   EMAIL_FROM               "Tradicion Mistica y Hermetica <contacto@tradicionmisticayhermetica.com>"
//   SITE_URL                 https://www.tradicionmisticayhermetica.com  (opcional, default a esta URL)
//
// Body esperado (JSON):
//   {
//     "campana_id": "uuid",
//     "email_destino": "tradicionmisticayhermetica@gmail.com",
//     "nombre_destino": "Test"            // opcional
//   }
// =============================================================================

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck — corre en Deno, no en Node.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import {
  renderEmailHtml,
  renderEmailTexto,
  type PostParaEmail,
} from "../_shared/newsletter-render.ts";

// =============================================================================
// CORS
// =============================================================================
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM =
  Deno.env.get("EMAIL_FROM") ??
  "Tradicion Mistica y Hermetica <onboarding@resend.dev>";
const SITE_URL =
  Deno.env.get("SITE_URL") ?? "https://www.tradicionmisticayhermetica.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// =============================================================================
// Validación simple de email
// =============================================================================
function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// =============================================================================
// Handler
// =============================================================================
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "metodo_no_permitido" }, 405);
  }

  if (!RESEND_API_KEY) {
    return jsonResponse(
      { ok: false, error: "config_falta", detalle: "RESEND_API_KEY no configurada en Edge Functions Secrets." },
      500,
    );
  }

  // ---------------------------------------------------------------------------
  // 1) Verificar que quien llama tenga sesión y sea admin.
  // ---------------------------------------------------------------------------
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ ok: false, error: "sin_token" }, 401);
  }

  // Cliente "como usuario" (con su JWT) para chequear es_admin().
  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: rpcAdmin, error: errAdmin } = await supabaseUser.rpc("es_admin");
  if (errAdmin || !rpcAdmin) {
    return jsonResponse(
      { ok: false, error: "no_autorizado", detalle: errAdmin?.message },
      403,
    );
  }

  // ---------------------------------------------------------------------------
  // 2) Parsear body
  // ---------------------------------------------------------------------------
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "json_invalido" }, 400);
  }

  const campanaId = (body?.campana_id ?? "").toString().trim();
  const emailDestino = (body?.email_destino ?? "").toString().trim().toLowerCase();
  const nombreDestino = body?.nombre_destino ? String(body.nombre_destino).trim() : null;

  if (!campanaId) return jsonResponse({ ok: false, error: "campana_id_falta" }, 400);
  if (!emailValido(emailDestino)) {
    return jsonResponse({ ok: false, error: "email_invalido" }, 400);
  }

  // ---------------------------------------------------------------------------
  // 3) Cargar la campaña + posts (con service_role para evitar RLS)
  // ---------------------------------------------------------------------------
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: campana, error: errC } = await supabaseAdmin
    .from("newsletter_campanas")
    .select("id, asunto, intro_html, imagen_destacada")
    .eq("id", campanaId)
    .maybeSingle();

  if (errC || !campana) {
    return jsonResponse(
      { ok: false, error: "campana_no_existe", detalle: errC?.message },
      404,
    );
  }

  const { data: postsRaw, error: errP } = await supabaseAdmin
    .from("newsletter_campana_posts")
    .select(
      "orden, posts:post_id (titulo, slug, extracto, imagen_destacada, publicado_en)",
    )
    .eq("campana_id", campanaId)
    .order("orden", { ascending: true });

  if (errP) {
    return jsonResponse(
      { ok: false, error: "error_cargando_posts", detalle: errP.message },
      500,
    );
  }

  const posts: PostParaEmail[] = (postsRaw ?? [])
    .map((row: any) => ({
      titulo: row.posts?.titulo ?? "(sin título)",
      slug: row.posts?.slug ?? "",
      extracto: row.posts?.extracto ?? null,
      imagen_destacada: row.posts?.imagen_destacada ?? null,
      publicado_en: row.posts?.publicado_en ?? null,
    }))
    .filter((p) => !!p.slug);

  // ---------------------------------------------------------------------------
  // 4) Render del HTML
  // ---------------------------------------------------------------------------
  const opcionesRender = {
    asunto: campana.asunto,
    introHtml: campana.intro_html,
    imagenDestacada: campana.imagen_destacada,
    posts,
    baseSitio: SITE_URL,
    tokenUnsubscribe: null,
    nombreDestinatario: nombreDestino,
    esPreview: false,
  };

  const html = renderEmailHtml(opcionesRender);
  const texto = renderEmailTexto(opcionesRender);

  // ---------------------------------------------------------------------------
  // 5) Enviar a Resend
  // ---------------------------------------------------------------------------
  const asuntoFinal = `[PRUEBA] ${campana.asunto}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [emailDestino],
      subject: asuntoFinal,
      html,
      text: texto,
      tags: [
        { name: "tipo", value: "newsletter_prueba" },
        { name: "campana_id", value: campanaId },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("[enviar-newsletter-prueba] resend error:", res.status, data);
    return jsonResponse(
      { ok: false, error: "resend_error", status: res.status, detalle: data },
      res.status,
    );
  }

  return jsonResponse({
    ok: true,
    resend_id: (data as any).id,
    enviado_a: emailDestino,
  });
});
