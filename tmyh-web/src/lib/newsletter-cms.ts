/**
 * Backoffice de newsletter (campañas + envíos).
 *
 * Modelo:
 *   - newsletter_campanas        : 1 fila = 1 newsletter (asunto, intro Tiptap, estado, contadores).
 *   - newsletter_campana_posts   : posts del blog que se incluyen, con orden.
 *   - newsletter_envios          : 1 fila por (campana × suscriptor) con estado.
 *
 * Lifecycle:
 *   borrador → lista → enviando → enviada
 *                   ↘ pausada ↗
 *                   ↘ cancelada (terminal)
 *
 * Las RPCs admin (encolar / pausar / reanudar / cancelar) viven en la
 * migración 017. Acá hay solo helpers para el panel.
 */

import { supabase } from "./supabase";

// =============================================================================
// Tipos
// =============================================================================

export type EstadoCampana =
  | "borrador"
  | "lista"
  | "enviando"
  | "enviada"
  | "pausada"
  | "cancelada"
  | "fallida";

export interface Campana {
  id: string;
  asunto: string;
  intro_html: string | null;
  intro_json: unknown | null;
  imagen_destacada: string | null;
  segmento: string;
  estado: EstadoCampana;
  remitente_email: string;
  remitente_nombre: string;
  total_destinatarios: number;
  enviados: number;
  fallidos: number;
  rebotados: number;
  abiertos: number;
  autor_id: string | null;
  creada_en: string;
  actualizada_en: string;
  encolada_en: string | null;
  primer_envio_en: string | null;
  ultimo_envio_en: string | null;
  enviada_en: string | null;
}

export interface CampanaPostRef {
  post_id: string;
  orden: number;
  // Datos del post para preview/listado (vienen del join):
  titulo?: string | null;
  slug?: string | null;
  extracto?: string | null;
  imagen_destacada?: string | null;
  publicado_en?: string | null;
}

export interface CampanaConPosts extends Campana {
  posts: CampanaPostRef[];
}

export interface PostParaSeleccion {
  id: string;
  slug: string;
  titulo: string;
  extracto: string | null;
  imagen_destacada: string | null;
  publicado_en: string | null;
}

export interface ResultadoSimple {
  ok: boolean;
  error?: string;
  detalle?: string;
}

// =============================================================================
// Listado y obtención
// =============================================================================

/**
 * Devuelve todas las campañas, más recientes primero. Por defecto excluye
 * canceladas si `incluirCanceladas=false` (útil para el listado principal).
 */
export async function listarCampanas(
  limite = 100,
  incluirCanceladas = true,
): Promise<Campana[]> {
  let q = supabase
    .from("newsletter_campanas")
    .select(
      "id, asunto, intro_html, imagen_destacada, segmento, estado, remitente_email, remitente_nombre, total_destinatarios, enviados, fallidos, rebotados, abiertos, autor_id, creada_en, actualizada_en, encolada_en, primer_envio_en, ultimo_envio_en, enviada_en",
    )
    .order("creada_en", { ascending: false })
    .limit(limite);

  if (!incluirCanceladas) q = q.neq("estado", "cancelada");

  const { data, error } = await q;
  if (error) {
    console.error("[newsletter.listarCampanas]", error);
    return [];
  }
  return (data ?? []).map((c) => ({ ...c, intro_json: null })) as Campana[];
}

/**
 * Trae una campaña con sus posts ya joinados y ordenados.
 */
export async function obtenerCampana(
  id: string,
): Promise<CampanaConPosts | null> {
  const { data, error } = await supabase
    .from("newsletter_campanas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[newsletter.obtenerCampana]", error);
    return null;
  }

  const posts = await listarPostsDeCampana(id);
  return { ...(data as Campana), posts };
}

/**
 * Lista los posts vinculados a una campaña, en su orden, con datos
 * suficientes para mostrarlos como tarjetas.
 */
export async function listarPostsDeCampana(
  campanaId: string,
): Promise<CampanaPostRef[]> {
  const { data, error } = await supabase
    .from("newsletter_campana_posts")
    .select(
      "post_id, orden, posts:post_id (titulo, slug, extracto, imagen_destacada, publicado_en)",
    )
    .eq("campana_id", campanaId)
    .order("orden", { ascending: true });

  if (error) {
    console.error("[newsletter.listarPostsDeCampana]", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    post_id: row.post_id,
    orden: row.orden,
    titulo: row.posts?.titulo ?? null,
    slug: row.posts?.slug ?? null,
    extracto: row.posts?.extracto ?? null,
    imagen_destacada: row.posts?.imagen_destacada ?? null,
    publicado_en: row.posts?.publicado_en ?? null,
  })) as CampanaPostRef[];
}

/**
 * Posts publicados disponibles para incluir en una campaña.
 * Excluye borradores, archivados y los que están en papelera.
 */
export async function listarPostsPublicadosParaSeleccion(
  limite = 200,
): Promise<PostParaSeleccion[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, slug, titulo, extracto, imagen_destacada, publicado_en",
    )
    .eq("estado", "publicado")
    .is("eliminado_en", null)
    .order("publicado_en", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("[newsletter.listarPostsPublicadosParaSeleccion]", error);
    return [];
  }
  return (data ?? []) as PostParaSeleccion[];
}

// =============================================================================
// Crear / actualizar campaña
// =============================================================================

export interface DatosCampana {
  id?: string;
  asunto: string;
  intro_html?: string | null;
  intro_json?: unknown | null;
  imagen_destacada?: string | null;
  segmento?: string;
}

export interface ResultadoGuardar {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Crea o actualiza una campaña. Solo permite modificar campañas en estado
 * 'borrador' o 'pausada' — el resto se considera locked.
 *
 * Para asociar posts, usar setPostsDeCampana() después.
 */
export async function guardarCampana(
  datos: DatosCampana,
): Promise<ResultadoGuardar> {
  const payload = {
    asunto: datos.asunto.trim(),
    intro_html: datos.intro_html ?? null,
    intro_json: datos.intro_json ?? null,
    imagen_destacada: datos.imagen_destacada ?? null,
    segmento: datos.segmento ?? "todos",
  };

  if (!payload.asunto) {
    return { ok: false, error: "El asunto es obligatorio" };
  }

  if (datos.id) {
    const { data, error } = await supabase
      .from("newsletter_campanas")
      .update(payload)
      .eq("id", datos.id)
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("[newsletter.guardarCampana] update", error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id ?? datos.id };
  }

  const { data, error } = await supabase
    .from("newsletter_campanas")
    .insert(payload)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[newsletter.guardarCampana] insert", error);
    return { ok: false, error: error.message };
  }
  return { ok: true, id: data?.id };
}

/**
 * Reemplaza la lista de posts asociados a una campaña por la nueva lista.
 * El orden del array es el que se respeta en el email.
 *
 * Estrategia: borrar todos los vínculos previos e insertar los nuevos.
 * Es seguro porque la junction no tiene datos propios más allá de orden.
 */
export async function setPostsDeCampana(
  campanaId: string,
  postIds: string[],
): Promise<ResultadoSimple> {
  // 1) Borrar los vínculos actuales.
  const { error: errDel } = await supabase
    .from("newsletter_campana_posts")
    .delete()
    .eq("campana_id", campanaId);
  if (errDel) {
    console.error("[newsletter.setPostsDeCampana] delete", errDel);
    return { ok: false, error: errDel.message };
  }

  if (postIds.length === 0) return { ok: true };

  // 2) Insertar los nuevos en orden.
  const filas = postIds.map((post_id, i) => ({
    campana_id: campanaId,
    post_id,
    orden: i + 1,
  }));

  const { error: errIns } = await supabase
    .from("newsletter_campana_posts")
    .insert(filas);
  if (errIns) {
    console.error("[newsletter.setPostsDeCampana] insert", errIns);
    return { ok: false, error: errIns.message };
  }
  return { ok: true };
}

/**
 * Elimina una campaña. Solo permitido si está en estado 'borrador' o 'cancelada'.
 * Las campañas con envíos activos no se borran (se cancelan).
 */
export async function eliminarCampana(id: string): Promise<ResultadoSimple> {
  const { error } = await supabase
    .from("newsletter_campanas")
    .delete()
    .eq("id", id)
    .in("estado", ["borrador", "cancelada", "fallida"]);
  if (error) {
    console.error("[newsletter.eliminarCampana]", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// =============================================================================
// RPCs de lifecycle
// =============================================================================

/**
 * Encola la campaña: genera filas en newsletter_envios para todos los
 * suscriptores con optin=true y la pasa a estado 'lista'.
 */
export async function encolarCampana(id: string): Promise<ResultadoSimple> {
  const { data, error } = await supabase.rpc("newsletter_encolar_campana", {
    p_campana_id: id,
  });
  if (error) return { ok: false, error: error.message };
  const r = data as any;
  if (!r?.ok) return { ok: false, error: r?.error ?? "error_rpc", detalle: r?.error_detalle };
  return { ok: true };
}

export async function pausarCampana(id: string): Promise<ResultadoSimple> {
  const { data, error } = await supabase.rpc("newsletter_pausar_campana", {
    p_campana_id: id,
  });
  if (error) return { ok: false, error: error.message };
  const r = data as any;
  if (!r?.ok) return { ok: false, error: r?.error ?? "error_rpc" };
  return { ok: true };
}

export async function reanudarCampana(id: string): Promise<ResultadoSimple> {
  const { data, error } = await supabase.rpc("newsletter_reanudar_campana", {
    p_campana_id: id,
  });
  if (error) return { ok: false, error: error.message };
  const r = data as any;
  if (!r?.ok) return { ok: false, error: r?.error ?? "error_rpc" };
  return { ok: true };
}

export async function cancelarCampana(id: string): Promise<ResultadoSimple> {
  const { data, error } = await supabase.rpc("newsletter_cancelar_campana", {
    p_campana_id: id,
  });
  if (error) return { ok: false, error: error.message };
  const r = data as any;
  if (!r?.ok) return { ok: false, error: r?.error ?? "error_rpc" };
  return { ok: true };
}

// =============================================================================
// Envío de prueba (edge function `enviar-newsletter-prueba`)
// =============================================================================

export interface ResultadoEnvioPrueba {
  ok: boolean;
  resend_id?: string;
  enviado_a?: string;
  error?: string;
  detalle?: unknown;
}

/**
 * Manda una copia de la campaña a una dirección puntual sin tocar las filas
 * de envío masivo. Útil para validar el render antes de encolar.
 */
export async function enviarPruebaCampana(
  campanaId: string,
  emailDestino: string,
  nombreDestino?: string,
): Promise<ResultadoEnvioPrueba> {
  const { data, error } = await supabase.functions.invoke(
    "enviar-newsletter-prueba",
    {
      body: {
        campana_id: campanaId,
        email_destino: emailDestino,
        nombre_destino: nombreDestino ?? null,
      },
    },
  );

  if (error) {
    console.error("[newsletter.enviarPruebaCampana] invoke", error);
    return { ok: false, error: error.message };
  }

  if (!data?.ok) {
    return {
      ok: false,
      error: data?.error ?? "error_desconocido",
      detalle: data?.detalle,
    };
  }

  return { ok: true, resend_id: data.resend_id, enviado_a: data.enviado_a };
}

// =============================================================================
// Vista de envíos (detalle de campaña)
// =============================================================================

export type EstadoEnvio =
  | "pendiente"
  | "enviando"
  | "enviado"
  | "fallido"
  | "rebotado_definitivo"
  | "cancelado";

export interface EnvioCampana {
  id: string;
  campana_id: string;
  contacto_id: string;
  email_snapshot: string;
  nombre_snapshot: string | null;
  estado: EstadoEnvio;
  intentos: number;
  resend_id: string | null;
  error_codigo: string | null;
  error_mensaje: string | null;
  creado_en: string;
  enviado_en: string | null;
  abierto_en: string | null;
  rebotado_en: string | null;
}

/**
 * Lista los envíos de una campaña filtrados por estado opcional.
 * Soporta paginación simple por offset.
 */
export async function listarEnviosDeCampana(
  campanaId: string,
  opciones: {
    estado?: EstadoEnvio | "todos";
    busqueda?: string;
    limite?: number;
    offset?: number;
  } = {},
): Promise<{ filas: EnvioCampana[]; total: number }> {
  const limite = opciones.limite ?? 100;
  const offset = opciones.offset ?? 0;

  let q = supabase
    .from("newsletter_envios")
    .select(
      "id, campana_id, contacto_id, email_snapshot, nombre_snapshot, estado, intentos, resend_id, error_codigo, error_mensaje, creado_en, enviado_en, abierto_en, rebotado_en",
      { count: "exact" },
    )
    .eq("campana_id", campanaId)
    .order("creado_en", { ascending: true })
    .range(offset, offset + limite - 1);

  if (opciones.estado && opciones.estado !== "todos") {
    q = q.eq("estado", opciones.estado);
  }
  if (opciones.busqueda && opciones.busqueda.trim()) {
    const term = `%${opciones.busqueda.trim()}%`;
    q = q.or(`email_snapshot.ilike.${term},nombre_snapshot.ilike.${term}`);
  }

  const { data, error, count } = await q;
  if (error) {
    console.error("[newsletter.listarEnviosDeCampana]", error);
    return { filas: [], total: 0 };
  }
  return { filas: (data ?? []) as EnvioCampana[], total: count ?? 0 };
}

// =============================================================================
// Helpers de presentación
// =============================================================================

export const ETIQUETA_ESTADO_CAMPANA: Record<EstadoCampana, string> = {
  borrador: "Borrador",
  lista: "En cola",
  enviando: "Enviando",
  enviada: "Enviada",
  pausada: "Pausada",
  cancelada: "Cancelada",
  fallida: "Fallida",
};

export const COLOR_ESTADO_CAMPANA: Record<EstadoCampana, string> = {
  // (texto, borde, fondo) en clases tailwind. Coordinado con el resto del panel.
  borrador: "text-parchment-400 border-parchment-400/30",
  lista: "text-gold-300 border-gold-400/40 bg-gold-400/5",
  enviando: "text-gold-200 border-gold-400/60 bg-gold-400/10",
  enviada: "text-emerald-300 border-emerald-400/40 bg-emerald-400/5",
  pausada: "text-amber-300 border-amber-400/40 bg-amber-400/5",
  cancelada: "text-parchment-600 border-parchment-600/20 opacity-60",
  fallida: "text-wine-300 border-wine-400/40 bg-wine-400/5",
};

/**
 * Calcula el % completado de una campaña: (enviados + fallidos + rebotados) / total.
 * Útil para barra de progreso. Retorna 0..100.
 */
export function progresoCampana(c: Campana): number {
  if (!c.total_destinatarios) return 0;
  const procesados = c.enviados + c.fallidos + c.rebotados;
  return Math.min(100, Math.round((procesados * 100) / c.total_destinatarios));
}

/**
 * Estimación de tiempo restante para terminar la campaña, asumiendo el
 * límite Free de Resend (~100 mails/día). Devuelve string legible.
 */
export function estimacionRestante(
  c: Campana,
  cuotaDiaria = 100,
): string {
  if (c.estado === "enviada" || c.estado === "cancelada") return "—";
  if (!c.total_destinatarios) return "—";
  const procesados = c.enviados + c.fallidos + c.rebotados;
  const pendientes = Math.max(0, c.total_destinatarios - procesados);
  if (pendientes === 0) return "Listo";
  const dias = Math.ceil(pendientes / cuotaDiaria);
  return dias === 1 ? "~1 día" : `~${dias} días`;
}
