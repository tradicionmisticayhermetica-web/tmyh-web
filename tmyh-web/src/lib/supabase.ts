/**
 * Cliente de Supabase para el NAVEGADOR (browser-side).
 *
 * Usa la `anon key` publica. Es seguro exponerla en el cliente porque:
 *  - Las tablas tienen RLS activo y sin policies abiertas.
 *  - El formulario de contacto solo puede llamar a la funcion RPC
 *    `enviar_mensaje_contacto` (con security definer), no tocar tablas
 *    directas.
 *
 * Variables de entorno requeridas (.env en la raiz de tmyh-web):
 *   PUBLIC_SUPABASE_URL      https://<proyecto>.supabase.co
 *   PUBLIC_SUPABASE_ANON_KEY eyJ... (anon public key)
 *
 * El prefijo PUBLIC_ es el que usa Astro para exponer variables al bundle
 * del cliente. Ver: https://docs.astro.build/en/guides/environment-variables/
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as
  | string
  | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // No tiramos error para no romper el build si alguien clona sin .env;
  // pero cualquier llamada a supabase fallara con mensaje claro abajo.
  console.warn(
    "[supabase] faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY en .env. El formulario de contacto no funcionara hasta que se configuren.",
  );
}

export const supabase = createClient(
  SUPABASE_URL ?? "https://invalid.supabase.co",
  SUPABASE_ANON_KEY ?? "invalid-key",
  {
    auth: {
      // Activado para soportar el login del panel /area-reservada.
      // El SDK guarda la sesion en localStorage y refresca el JWT solo.
      // Para visitantes anonimos no se crea ninguna sesion (no usan auth).
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "tmyh-auth",
    },
  },
);

/**
 * Resultado normalizado que devuelve la RPC `enviar_mensaje_contacto`.
 * Mantiene el mismo shape que el jsonb del SQL para que el front solo
 * haga `if (data.ok) ...`.
 */
export interface RespuestaEnviarMensaje {
  ok: boolean;
  mensaje_id?: string;
  error?:
    | "nombre_invalido"
    | "email_vacio"
    | "email_invalido"
    | "mensaje_muy_corto"
    | "mensaje_muy_largo"
    | "limite_diario"
    | "limite_ip"
    | "error_interno"
    | "red"
    | "config";
}

export interface PayloadMensajeContacto {
  nombre: string;
  apellido?: string;
  email: string;
  telefono?: string;
  curso_interes?: string;
  mensaje: string;
  newsletter_optin?: boolean;
  user_agent?: string;
}

/**
 * Envia el formulario a la RPC de Supabase. Wraps la llamada con manejo de
 * errores de red y normaliza la respuesta.
 */
export async function enviarMensajeContacto(
  payload: PayloadMensajeContacto,
): Promise<RespuestaEnviarMensaje> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, error: "config" };
  }

  try {
    const { data, error } = await supabase.rpc("enviar_mensaje_contacto", {
      p_nombre: payload.nombre,
      p_apellido: payload.apellido ?? null,
      p_email: payload.email,
      p_telefono: payload.telefono ?? null,
      p_curso_interes: payload.curso_interes ?? null,
      p_mensaje: payload.mensaje,
      p_newsletter_optin: payload.newsletter_optin ?? false,
      p_user_agent: payload.user_agent ?? null,
    });

    if (error) {
      console.error("[supabase.rpc] error:", error);
      return { ok: false, error: "red" };
    }

    // La funcion siempre devuelve un jsonb con shape RespuestaEnviarMensaje.
    return data as RespuestaEnviarMensaje;
  } catch (err) {
    console.error("[supabase.rpc] exception:", err);
    return { ok: false, error: "red" };
  }
}

// ======================================================================
// Newsletter: unsubscribe / resubscribe / estado
// ======================================================================

export interface EstadoNewsletter {
  ok: boolean;
  error?: string;
  email?: string;
  suscripto?: boolean;
  desde?: string | null;
  baja?: string | null;
}

export interface AccionNewsletter {
  ok: boolean;
  error?: string;
  email?: string;
  ya_estaba_desuscripto?: boolean;
  ya_estaba_suscripto?: boolean;
}

export async function obtenerEstadoNewsletter(
  token: string,
): Promise<EstadoNewsletter> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, error: "config" };
  }
  try {
    const { data, error } = await supabase.rpc("newsletter_estado", {
      p_token: token,
    });
    if (error) return { ok: false, error: "red" };
    return data as EstadoNewsletter;
  } catch {
    return { ok: false, error: "red" };
  }
}

export async function desuscribirNewsletter(
  token: string,
  motivo?: string,
): Promise<AccionNewsletter> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, error: "config" };
  }
  try {
    const { data, error } = await supabase.rpc("newsletter_unsubscribe", {
      p_token: token,
      p_motivo: motivo ?? null,
      p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    if (error) return { ok: false, error: "red" };
    return data as AccionNewsletter;
  } catch {
    return { ok: false, error: "red" };
  }
}

export async function resuscribirNewsletter(
  token: string,
): Promise<AccionNewsletter> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, error: "config" };
  }
  try {
    const { data, error } = await supabase.rpc("newsletter_resubscribe", {
      p_token: token,
      p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    if (error) return { ok: false, error: "red" };
    return data as AccionNewsletter;
  } catch {
    return { ok: false, error: "red" };
  }
}

/**
 * Suscribe un email simple al newsletter desde una caja publica (footer,
 * lead magnet, etc). No requiere los datos del formulario de contacto
 * completo: solo el email. La RPC `newsletter_suscribir_email` se encarga
 * de crear el contacto si no existe o reactivarlo si estaba dado de baja.
 *
 * Devuelve:
 *   - `{ok:true, ya_estaba_suscripto:false}` → caso feliz, primera vez o reactivacion.
 *   - `{ok:true, ya_estaba_suscripto:true}` → el email ya estaba suscripto (idempotente).
 *   - `{ok:false, error:'email_invalido' | 'limite_email' | 'limite_ip' | ...}` → error de validacion o rate limit.
 */
export interface ResultadoSuscripcionPublica {
  ok: boolean;
  ya_estaba_suscripto?: boolean;
  email?: string;
  error?: string;
}

export async function suscribirNewsletterEmail(
  email: string,
  origen: string = "web:footer",
): Promise<ResultadoSuscripcionPublica> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, error: "config" };
  }
  try {
    const { data, error } = await supabase.rpc("newsletter_suscribir_email", {
      p_email: email,
      p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      p_ip_hash: null, // El servidor no recibe IP del browser; queda como null.
      p_origen: origen,
    });
    if (error) {
      console.error("[suscribirNewsletterEmail] RPC error", error);
      return { ok: false, error: "red" };
    }
    return data as ResultadoSuscripcionPublica;
  } catch (err) {
    console.error("[suscribirNewsletterEmail] excepcion", err);
    return { ok: false, error: "red" };
  }
}
