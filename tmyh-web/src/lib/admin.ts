/**
 * Queries del panel /area-reservada.
 *
 * El panel es archivo de mensajes recibidos (read-only) + base para futuro
 * editor de newsletter. La gestion de respuestas a los visitantes se hace
 * desde Gmail (la notificacion ya tiene Reply-To al visitante).
 *
 * Todas las llamadas usan el cliente con sesion activa (`supabase` de
 * supabase.ts). Las RLS en Supabase aseguran que solo admins pueden ver
 * mensajes y resumen.
 */

import { supabase } from "./supabase";

export interface MensajeContacto {
  id: string;
  creado_en: string;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono: string | null;
  curso_interes: string | null;
  mensaje: string;
  newsletter_optin: boolean;
  origen: string;
  contacto_id: string;
}

export interface ResumenPanel {
  total_mensajes: number;
  mensajes_ultima_semana: number;
  mensajes_ultimo_mes: number;
  total_contactos: number;
  suscriptores_newsletter: number;
}

/**
 * Lista los mensajes recibidos. Devuelve [] en error.
 */
export async function listarMensajes(
  limite = 200,
): Promise<MensajeContacto[]> {
  const { data, error } = await supabase
    .from("mensajes_contacto")
    .select(
      "id, creado_en, nombre, apellido, email, telefono, curso_interes, mensaje, newsletter_optin, origen, contacto_id",
    )
    .order("creado_en", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("[admin.listarMensajes]", error);
    return [];
  }
  return (data ?? []) as MensajeContacto[];
}

/**
 * Trae un mensaje por id.
 */
export async function obtenerMensaje(
  id: string,
): Promise<MensajeContacto | null> {
  const { data, error } = await supabase
    .from("mensajes_contacto")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[admin.obtenerMensaje]", error);
    return null;
  }
  return data as MensajeContacto;
}

/**
 * KPIs simples para el dashboard.
 */
export async function obtenerResumen(): Promise<ResumenPanel | null> {
  const { data, error } = await supabase
    .from("panel_resumen")
    .select("*")
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("[admin.obtenerResumen]", error);
    return null;
  }
  return data as ResumenPanel;
}

// =============================================================================
// Posts del blog
// =============================================================================

export interface PostBlog {
  id: string;
  slug: string;
  titulo: string;
  extracto: string | null;
  contenido_json: unknown | null;
  contenido_html: string | null;
  imagen_destacada: string | null;
  autor_id: string | null;
  estado: "borrador" | "publicado" | "archivado";
  etiquetas: string[];
  publicado_en: string | null;
  eliminado_en: string | null;
  creado_en: string;
  actualizado_en: string;
  // Borrador de revisión (cambios en progreso que aún no se publicaron)
  borrador_titulo?: string | null;
  borrador_extracto?: string | null;
  borrador_slug?: string | null;
  borrador_json?: unknown | null;
  borrador_html?: string | null;
  borrador_etiquetas?: string[] | null;
  borrador_modificado_en?: string | null;
}

export type EstadoPost = PostBlog["estado"];

export interface ResultadoGuardarPost {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Lista posts activos (no eliminados).
 * Admins ven borradores y archivados; el filtro de papelera es aparte.
 */
export async function listarPosts(limite = 100): Promise<PostBlog[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, slug, titulo, extracto, imagen_destacada, estado, etiquetas, publicado_en, eliminado_en, creado_en, actualizado_en",
    )
    .is("eliminado_en", null)
    .order("creado_en", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("[admin.listarPosts]", error);
    return [];
  }
  return (data ?? []) as PostBlog[];
}

/** Lista posts en la papelera (eliminado_en IS NOT NULL). */
export async function listarPapelera(limite = 100): Promise<PostBlog[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, slug, titulo, extracto, estado, etiquetas, eliminado_en, creado_en",
    )
    .not("eliminado_en", "is", null)
    .order("eliminado_en", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("[admin.listarPapelera]", error);
    return [];
  }
  return (data ?? []) as PostBlog[];
}

/** Trae un post completo por id (incluyendo contenido_json y contenido_html). */
export async function obtenerPost(id: string): Promise<PostBlog | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[admin.obtenerPost]", error);
    return null;
  }
  return data as PostBlog;
}

/** Trae un post completo por slug (para el blog público). */
export async function obtenerPostPorSlug(slug: string): Promise<PostBlog | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("estado", "publicado")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[admin.obtenerPostPorSlug]", error);
    return null;
  }
  return data as PostBlog;
}

/** Lista los posts publicados para el blog público. */
export async function listarPostsPublicos(limite = 50): Promise<PostBlog[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, slug, titulo, extracto, imagen_destacada, etiquetas, publicado_en, creado_en",
    )
    .eq("estado", "publicado")
    .order("publicado_en", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("[admin.listarPostsPublicos]", error);
    return [];
  }
  return (data ?? []) as PostBlog[];
}

/** Crea o actualiza un post. Si no tiene `id`, crea uno nuevo. */
export async function guardarPost(
  datos: Partial<PostBlog> & { titulo: string; slug: string },
): Promise<ResultadoGuardarPost> {
  const { id, ...campos } = datos;

  // Limpiar campos que no deben enviarse directamente
  const { creado_en: _c, actualizado_en: _a, autor_id: _au, ...payload } = campos as any;

  if (id) {
    // Update
    const { data, error } = await supabase
      .from("posts")
      .update(payload)
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[admin.guardarPost] update", error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id ?? id };
  }

  // Insert
  const { data, error } = await supabase
    .from("posts")
    .insert(payload)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[admin.guardarPost] insert", error);
    return { ok: false, error: error.message };
  }
  return { ok: true, id: data?.id };
}

/** Guarda un borrador de revisión sin tocar el contenido publicado. */
export async function guardarBorrador(
  id: string,
  datos: { titulo: string; extracto?: string | null; slug: string; contenido_json?: unknown | null; contenido_html?: string | null; etiquetas?: string[] },
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("guardar_borrador_post", {
    p_post_id:        id,
    p_titulo:         datos.titulo,
    p_extracto:       datos.extracto ?? null,
    p_slug:           datos.slug,
    p_contenido_json: datos.contenido_json ?? null,
    p_contenido_html: datos.contenido_html ?? null,
    p_etiquetas:      datos.etiquetas ?? [],
  });
  if (error) return { ok: false, error: error.message };
  const r = data as any;
  if (!r?.ok) return { ok: false, error: r?.error ?? "error_rpc" };
  return { ok: true };
}

/** Publica la revisión pendiente (borra el borrador y actualiza el post live). */
export async function publicarRevision(
  id: string,
  datos: { titulo: string; extracto?: string | null; slug: string; contenido_json?: unknown | null; contenido_html?: string | null; etiquetas?: string[] },
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("publicar_revision_post", {
    p_post_id:        id,
    p_titulo:         datos.titulo,
    p_extracto:       datos.extracto ?? null,
    p_slug:           datos.slug,
    p_contenido_json: datos.contenido_json ?? null,
    p_contenido_html: datos.contenido_html ?? null,
    p_etiquetas:      datos.etiquetas ?? [],
  });
  if (error) return { ok: false, error: error.message };
  const r = data as any;
  if (!r?.ok) return { ok: false, error: r?.error ?? "error_rpc" };
  return { ok: true };
}

/** Descarta el borrador de revisión sin modificar el contenido publicado. */
export async function descartarBorrador(id: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("descartar_borrador_post", { p_post_id: id });
  if (error) return { ok: false, error: error.message };
  const r = data as any;
  if (!r?.ok) return { ok: false, error: r?.error ?? "error_rpc" };
  return { ok: true };
}

/** Archiva un post (oculto del blog pero recuperable). */
export async function archivarPost(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("posts")
    .update({ estado: "archivado" })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Mueve un post a la papelera (soft delete). */
export async function moverAPapelera(id: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase
    .rpc("mover_post_a_papelera", { p_post_id: id });

  if (error) return { ok: false, error: error.message };
  const r = data as any;
  if (!r?.ok) return { ok: false, error: r?.error ?? "error_rpc" };
  return { ok: true };
}

/** Restaura un post desde la papelera (vuelve a borrador). */
export async function restaurarDePapelera(id: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase
    .rpc("restaurar_post", { p_post_id: id });

  if (error) return { ok: false, error: error.message };
  const r = data as any;
  if (!r?.ok) return { ok: false, error: r?.error ?? "error_rpc" };
  return { ok: true };
}

/** Elimina definitivamente un post de la base de datos. Solo admins. */
export async function eliminarPostDefinitivamente(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Formatea una fecha ISO a algo legible en es-AR.
 */
export function formatearFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function nombreCompleto(m: MensajeContacto): string {
  return [m.nombre, m.apellido].filter(Boolean).join(" ");
}
