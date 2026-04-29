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
