// =============================================================================
// Edge Function: procesar-newsletter-cola
// =============================================================================
// Worker del newsletter masivo. Cada vez que se invoca:
//
//   1) Rescata envíos trabados (workers caídos): los pasa a 'pendiente'.
//   2) Cuenta cuántos mails se mandaron HOY y calcula la cuota restante.
//   3) Pide un lote a la BD via newsletter_proximo_lote(N), donde N es
//      min(BATCH_SIZE, cuota_restante). La BD reserva las filas marcándolas
//      como 'enviando' (FOR UPDATE SKIP LOCKED).
//   4) Por cada fila del lote:
//        a) Verifica que el contacto siga teniendo newsletter_optin = true.
//           Si se desuscribió entre encolar y enviar, se cancela ese envío.
//        b) Arma el HTML con renderEmailHtml() (compartido).
//        c) Manda con Resend (mismas creds que las otras functions).
//        d) Reporta resultado: marcar_enviado / marcar_fallido.
//   5) Cuando una campaña ya no tiene pendientes ni enviando, se cierra
//      automáticamente (lo hace cerrar_campana_si_corresponde via las RPCs
//      de marcar_*).
//
// Quién la invoca:
//   - Cron de Supabase (pg_cron) cada hora — ver migración 018.
//   - Manual desde el panel cuando el admin toca "Procesar ahora" (futuro).
//
// Auth:
//   - Service role JWT (caso cron) → permitido.
//   - JWT de admin (caso panel) → permitido si es_admin() = true.
//
// DEPLOY:
//   npx supabase functions deploy procesar-newsletter-cola --no-verify-jwt
//
// Variables de entorno requeridas:
//   RESEND_API_KEY               re_xxxxx... (compartida con las otras functions)
//   EMAIL_FROM                   "Tradicion Mistica y Hermetica <contacto@...>"
//   SITE_URL                     https://www.tradicionmisticayhermetica.com
//   NEWSLETTER_DAILY_LIMIT       95 (default; cuota diaria con margen sobre 100 Free)
//   NEWSLETTER_BATCH_SIZE        12 (default; tope de mails por corrida)
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
// CORS (si se invoca desde el panel)
// =============================================================================
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

// =============================================================================
// Config
// =============================================================================
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM =
  Deno.env.get("EMAIL_FROM") ??
  "Tradicion Mistica y Hermetica <onboarding@resend.dev>";
const SITE_URL =
  Deno.env.get("SITE_URL") ?? "https://www.tradicionmisticayhermetica.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DAILY_LIMIT = Math.max(
  1,
  parseInt(Deno.env.get("NEWSLETTER_DAILY_LIMIT") ?? "95", 10),
);
const BATCH_SIZE = Math.max(
  1,
  parseInt(Deno.env.get("NEWSLETTER_BATCH_SIZE") ?? "12", 10),
);
const RESCATE_MINUTOS = 15;

// =============================================================================
// Helpers
// =============================================================================
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function logInfo(...args: any[]) {
  console.log("[newsletter-worker]", ...args);
}
function logError(...args: any[]) {
  console.error("[newsletter-worker]", ...args);
}

/**
 * Decide si el error de Resend es un "rebote duro" (mail inexistente,
 * dominio inválido, etc.) o un error transitorio (timeout, 5xx, etc.).
 *
 * Resend devuelve un `name` en el body cuando hay error. Códigos típicos
 * de bounce duro: `validation_error` con `email is invalid`,
 * `invalid_to_address`, `dns_error`, `domain_not_found`. El resto se
 * trata como fallido transitorio (sin auto-baja).
 */
function esBounceDuro(status: number, body: any): boolean {
  if (status === 422) return true; // validation_error: dirección inválida
  const name = String(body?.name ?? "").toLowerCase();
  if (
    name.includes("invalid") ||
    name.includes("not_found") ||
    name.includes("dns") ||
    name.includes("domain")
  ) {
    return true;
  }
  return false;
}

// =============================================================================
// Auth: acepta service_role O usuario admin
// =============================================================================
// Acepta como válido cualquiera de estos casos:
//   1) Token idéntico al env SUPABASE_SERVICE_ROLE_KEY (caso clásico).
//   2) JWT con payload.role === 'service_role' (más robusto: el proyecto
//      puede haber rotado claves, pero un JWT firmado con `role: service_role`
//      del proyecto sigue siendo válido; igual lo verificamos abajo intentando
//      una operación que solo service_role puede hacer).
//   3) Header Authorization de un usuario logueado y admin (es_admin() = true).
// Devuelve un campo `motivo` cuando rechaza, útil para diagnóstico en logs.
type AuthResultado = { ok: true; modo: "service" | "admin" } | { ok: false; motivo: string };

function decodificarPayloadJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

async function autenticar(req: Request): Promise<AuthResultado> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { ok: false, motivo: "sin_header_authorization" };
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false, motivo: "token_vacio" };

  // 1) Comparación directa con el env del proyecto.
  if (SUPABASE_SERVICE_ROLE_KEY && token === SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: true, modo: "service" };
  }

  // 2) ¿Es un JWT con role: service_role? Verificamos haciendo una llamada
  //    autenticada con ese mismo token; si el proyecto lo firma, Supabase
  //    nos deja consultar tablas con RLS de admin.
  const payload = decodificarPayloadJwt(token);
  if (payload?.role === "service_role") {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader, apikey: token } },
    });
    const { error } = await sb.from("newsletter_campanas").select("id").limit(1);
    if (!error) return { ok: true, modo: "service" };
    logError("Token con role=service_role no validó contra newsletter_campanas:", error.message);
  }

  // 3) Usuario admin (JWT de Supabase Auth).
  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  try {
    const { data: rpcAdmin, error } = await supabaseUser.rpc("es_admin");
    if (error) return { ok: false, motivo: `es_admin_error: ${error.message}` };
    if (rpcAdmin) return { ok: true, modo: "admin" };
    return { ok: false, motivo: "no_es_admin" };
  } catch (e) {
    return { ok: false, motivo: `excepcion_es_admin: ${e}` };
  }
}

// =============================================================================
// Worker: procesar un lote
// =============================================================================
async function procesarLote() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // -------------------------------------------------------------------------
  // 1) Rescate de envíos trabados
  // -------------------------------------------------------------------------
  const { data: rescatados } = await supabase.rpc(
    "newsletter_rescatar_envios_trabados",
    { p_minutos: RESCATE_MINUTOS },
  );
  if (rescatados && rescatados > 0) {
    logInfo(`Rescatados ${rescatados} envíos trabados (>= ${RESCATE_MINUTOS}min en 'enviando')`);
  }

  // -------------------------------------------------------------------------
  // 2) Cuota diaria
  // -------------------------------------------------------------------------
  const { data: enviadosHoy, error: errCount } = await supabase.rpc(
    "newsletter_envios_hoy",
  );
  if (errCount) {
    logError("Error contando envíos del día:", errCount);
    return { ok: false, error: "contar_envios_hoy", detalle: errCount.message };
  }

  const cuotaRestante = Math.max(0, DAILY_LIMIT - (enviadosHoy ?? 0));
  if (cuotaRestante === 0) {
    logInfo(
      `Cuota diaria agotada: ${enviadosHoy}/${DAILY_LIMIT}. Salgo sin procesar.`,
    );
    return {
      ok: true,
      skipped: "cuota_diaria_agotada",
      enviados_hoy: enviadosHoy,
      cuota_diaria: DAILY_LIMIT,
      procesados: 0,
    };
  }

  const limiteLote = Math.min(BATCH_SIZE, cuotaRestante);

  // -------------------------------------------------------------------------
  // 3) Tomar el lote (la BD reserva las filas como 'enviando')
  // -------------------------------------------------------------------------
  const { data: lote, error: errLote } = await supabase.rpc(
    "newsletter_proximo_lote",
    { p_limite: limiteLote },
  );

  if (errLote) {
    logError("Error pidiendo lote:", errLote);
    return { ok: false, error: "proximo_lote", detalle: errLote.message };
  }

  if (!lote || lote.length === 0) {
    logInfo("No hay envíos pendientes en este momento.");
    return {
      ok: true,
      skipped: "sin_pendientes",
      enviados_hoy: enviadosHoy,
      cuota_diaria: DAILY_LIMIT,
      procesados: 0,
    };
  }

  logInfo(
    `Procesando lote de ${lote.length} (cuota restante hoy: ${cuotaRestante}/${DAILY_LIMIT}).`,
  );

  // -------------------------------------------------------------------------
  // 4) Procesar cada envío en serie. Resend no exige paralelismo y serializar
  //    nos protege contra rate-limits del API.
  // -------------------------------------------------------------------------
  const stats = {
    enviados: 0,
    fallidos: 0,
    rebotes: 0,
    optin_revocado: 0,
    cancelados: 0,
  };

  // Cache de campañas dentro de este lote (mismo render para varios destinatarios).
  const cacheCampanas = new Map<
    string,
    {
      asunto: string;
      intro_html: string | null;
      imagen_destacada: string | null;
      remitente_email: string;
      remitente_nombre: string;
      posts: PostParaEmail[];
    }
  >();

  async function getCampanaConPosts(campanaId: string) {
    const cached = cacheCampanas.get(campanaId);
    if (cached) return cached;

    const { data: campana } = await supabase
      .from("newsletter_campanas")
      .select(
        "asunto, intro_html, imagen_destacada, remitente_email, remitente_nombre",
      )
      .eq("id", campanaId)
      .maybeSingle();
    if (!campana) {
      throw new Error(`campana_no_existe:${campanaId}`);
    }

    const { data: postsRaw } = await supabase
      .from("newsletter_campana_posts")
      .select(
        "orden, posts:post_id (titulo, slug, extracto, imagen_destacada, publicado_en)",
      )
      .eq("campana_id", campanaId)
      .order("orden", { ascending: true });

    const posts: PostParaEmail[] = (postsRaw ?? [])
      .map((row: any) => ({
        titulo: row.posts?.titulo ?? "(sin título)",
        slug: row.posts?.slug ?? "",
        extracto: row.posts?.extracto ?? null,
        imagen_destacada: row.posts?.imagen_destacada ?? null,
        publicado_en: row.posts?.publicado_en ?? null,
      }))
      .filter((p) => !!p.slug);

    const valor = {
      asunto: campana.asunto,
      intro_html: campana.intro_html,
      imagen_destacada: campana.imagen_destacada,
      remitente_email: campana.remitente_email,
      remitente_nombre: campana.remitente_nombre,
      posts,
    };
    cacheCampanas.set(campanaId, valor);
    return valor;
  }

  for (const envio of lote) {
    try {
      // 4a) Verificar optin actual del contacto
      const { data: contacto } = await supabase
        .from("contactos")
        .select("newsletter_optin, nombre, apellido, newsletter_token_unsubscribe")
        .eq("id", envio.contacto_id)
        .maybeSingle();

      if (!contacto || !contacto.newsletter_optin) {
        // El contacto se desuscribió entre encolar y procesar. No mandamos.
        await supabase.rpc("newsletter_marcar_fallido", {
          p_envio_id: envio.envio_id,
          p_codigo: "optin_revoked",
          p_mensaje:
            "El destinatario se desuscribió entre la encolada y el envío.",
          p_es_bounce: false,
        });
        stats.optin_revocado += 1;
        continue;
      }

      // 4b) Cargar campaña + posts (cacheado por id)
      const campana = await getCampanaConPosts(envio.campana_id);

      const nombreContacto =
        [contacto.nombre, contacto.apellido].filter(Boolean).join(" ").trim() ||
        null;

      const opcionesRender = {
        asunto: campana.asunto,
        introHtml: campana.intro_html,
        imagenDestacada: campana.imagen_destacada,
        posts: campana.posts,
        baseSitio: SITE_URL,
        // Token real → link de baja funcional con un click.
        tokenUnsubscribe: contacto.newsletter_token_unsubscribe,
        nombreDestinatario: nombreContacto,
        esPreview: false,
      };

      const html = renderEmailHtml(opcionesRender);
      const text = renderEmailTexto(opcionesRender);

      // 4c) Enviar a Resend
      const fromHeader =
        campana.remitente_email && campana.remitente_nombre
          ? `${campana.remitente_nombre} <${campana.remitente_email}>`
          : EMAIL_FROM;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: fromHeader,
          to: [envio.email_snapshot],
          subject: campana.asunto,
          html,
          text,
          tags: [
            { name: "tipo", value: "newsletter" },
            { name: "campana_id", value: envio.campana_id },
          ],
          headers: {
            // RFC 8058: permite "List-Unsubscribe-Post" 1-click. Mejora
            // dramáticamente la entregabilidad en Gmail/Outlook.
            "List-Unsubscribe": `<${SITE_URL.replace(/\/$/, "")}/newsletter/preferencias?token=${encodeURIComponent(contacto.newsletter_token_unsubscribe)}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });

      const resBody: any = await res.json().catch(() => ({}));

      if (res.ok && resBody.id) {
        await supabase.rpc("newsletter_marcar_enviado", {
          p_envio_id: envio.envio_id,
          p_resend_id: resBody.id,
        });
        stats.enviados += 1;
      } else {
        const bounce = esBounceDuro(res.status, resBody);
        await supabase.rpc("newsletter_marcar_fallido", {
          p_envio_id: envio.envio_id,
          p_codigo: String(resBody?.name ?? `http_${res.status}`),
          p_mensaje:
            String(resBody?.message ?? "Resend respondió con error.").slice(
              0,
              500,
            ),
          p_es_bounce: bounce,
        });
        if (bounce) stats.rebotes += 1;
        else stats.fallidos += 1;

        logError(
          `Envío ${envio.envio_id} fallido (status=${res.status}, bounce=${bounce}):`,
          resBody,
        );
      }
    } catch (err) {
      // Error inesperado: dejamos el envío en 'fallido' transitorio.
      logError(`Excepción procesando envío ${envio.envio_id}:`, err);
      try {
        await supabase.rpc("newsletter_marcar_fallido", {
          p_envio_id: envio.envio_id,
          p_codigo: "excepcion",
          p_mensaje: String(err).slice(0, 500),
          p_es_bounce: false,
        });
      } catch (_e) {
        // Si ni siquiera podemos marcar fallido, salimos. El rescate de
        // envíos trabados (paso 1) lo recuperará en una corrida futura.
      }
      stats.fallidos += 1;
    }
  }

  logInfo("Lote terminado:", stats);

  return {
    ok: true,
    procesados: lote.length,
    ...stats,
    enviados_hoy: (enviadosHoy ?? 0) + stats.enviados,
    cuota_diaria: DAILY_LIMIT,
  };
}

// =============================================================================
// Handler HTTP
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
      {
        ok: false,
        error: "config_falta",
        detalle: "RESEND_API_KEY no configurada en Edge Functions Secrets.",
      },
      500,
    );
  }

  const auth = await autenticar(req);
  if (!auth.ok) {
    logError("Auth rechazada:", auth.motivo);
    return jsonResponse(
      { ok: false, error: "no_autorizado", motivo: auth.motivo },
      401,
    );
  }
  logInfo("Auth aceptada, modo:", auth.modo);

  try {
    const resultado = await procesarLote();
    return jsonResponse(resultado);
  } catch (err) {
    logError("Excepción en procesarLote:", err);
    return jsonResponse(
      { ok: false, error: "excepcion_global", detalle: String(err) },
      500,
    );
  }
});
