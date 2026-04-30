// =============================================================================
// Edge Function: trigger-build
// =============================================================================
// La dispara un Database Webhook de Supabase cuando se hace INSERT o UPDATE
// en `public.posts`. Si el post nuevo/modificado tiene estado = 'publicado',
// llama a la GitHub API para disparar el workflow `deploy.yml` en la rama
// `main`. Ese workflow buildea el sitio y pushea a `production`.
//
// Ferozo tiene un cron job que cada 10 min hace `git pull origin production`
// en public_html. Tiempo total post-publish → live: ~11 minutos.
//
// DEPLOY:
//   npx supabase functions deploy trigger-build --no-verify-jwt
//
// Variables de entorno requeridas:
//   GITHUB_TOKEN     ghp_xxx  (PAT con scope `workflow`)
//   GITHUB_REPO      tradicionmisticayhermetica-web/tmyh-web
//   (las agrega Supabase automaticamente: SUPABASE_URL, etc.)
// =============================================================================

// @ts-nocheck
// deno-lint-ignore-file no-explicit-any

const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
const GITHUB_REPO =
  Deno.env.get("GITHUB_REPO") ??
  "tradicionmisticayhermetica-web/tmyh-web";
const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_HEADERS,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return jsonResponse({ ok: true });
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "metodo_no_permitido" }, 405);
  }

  // Parsear el payload del Database Webhook de Supabase
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "json_invalido" }, 400);
  }

  // Solo nos interesa INSERT y UPDATE en tablas con contenido público.
  if (!["posts", "cursos"].includes(payload?.table)) {
    return jsonResponse({ ok: true, skipped: true, reason: "tabla no es posts" });
  }
  if (!["INSERT", "UPDATE"].includes(payload?.type)) {
    return jsonResponse({ ok: true, skipped: true, reason: "no es INSERT/UPDATE" });
  }

  // Solo disparar el build si el contenido quedó en un estado público.
  const record = payload?.record;
  const esPostPublicado = payload.table === "posts" && record?.estado === "publicado";
  const esCursoPublico =
    payload.table === "cursos" &&
    ["activo", "proximo", "historico"].includes(String(record?.estado ?? ""));
  if (!esPostPublicado && !esCursoPublico) {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: `${payload.table} en estado '${record?.estado}', no se buildea`,
    });
  }

  // Disparar el GitHub Actions workflow via workflow_dispatch
  if (!GITHUB_TOKEN) {
    console.error("[trigger-build] GITHUB_TOKEN no configurado");
    return jsonResponse({ ok: false, error: "config_github_token" }, 500);
  }

  const prefijo = payload.table === "cursos" ? "curso" : "post";
  const reason = payload.type === "INSERT"
    ? `nuevo ${prefijo}: ${record?.slug ?? record?.id}`
    : `${prefijo} actualizado: ${record?.slug ?? record?.id}`;

  const ghRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/deploy.yml/dispatches`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { reason },
      }),
    },
  );

  if (!ghRes.ok) {
    const err = await ghRes.text().catch(() => "");
    console.error("[trigger-build] GitHub API error:", ghRes.status, err);
    return jsonResponse(
      { ok: false, error: "github_api_error", status: ghRes.status, detalle: err },
      502,
    );
  }

  console.log(`[trigger-build] Workflow disparado: ${reason}`);
  return jsonResponse({ ok: true, reason });
});
