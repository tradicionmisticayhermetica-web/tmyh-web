/**
 * Helpers de autenticacion para el panel /area-reservada.
 *
 * Astro corre en modo estatico (output: static), asi que TODA la logica de
 * sesion vive en el navegador con `@supabase/supabase-js`. La sesion se
 * persiste en `localStorage` con la key `tmyh-auth` (ver supabase.ts).
 *
 * Roles soportados (definidos en public.perfiles.rol):
 *   - alumno
 *   - docente
 *   - admin
 *   - super_admin
 *
 * Solo `admin` y `super_admin` tienen acceso al panel.
 */

import { supabase } from "./supabase";
import type { Session, User } from "@supabase/supabase-js";

export type Rol = "alumno" | "docente" | "admin" | "super_admin";

export interface Perfil {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  rol: Rol;
  activo: boolean;
  creado_en: string;
}

export interface ResultadoLogin {
  ok: boolean;
  error?:
    | "credenciales_invalidas"
    | "email_no_confirmado"
    | "sin_permisos"
    | "perfil_inactivo"
    | "red"
    | "config";
  user?: User;
  perfil?: Perfil;
}

/**
 * Inicia sesion con email + password. Tras autenticar, lee el perfil y
 * verifica que tenga rol admin o super_admin.
 */
export async function iniciarSesion(
  email: string,
  password: string,
): Promise<ResultadoLogin> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      const msg = error.message?.toLowerCase() ?? "";
      if (msg.includes("not confirmed")) {
        return { ok: false, error: "email_no_confirmado" };
      }
      return { ok: false, error: "credenciales_invalidas" };
    }

    if (!data.user) {
      return { ok: false, error: "credenciales_invalidas" };
    }

    const perfil = await obtenerPerfil(data.user.id);
    if (!perfil) {
      // Sesion creada pero perfil no existe (caso muy raro: el trigger fallo).
      // Igual cerramos sesion para evitar estados zombie.
      await supabase.auth.signOut();
      return { ok: false, error: "sin_permisos" };
    }

    if (!perfil.activo) {
      await supabase.auth.signOut();
      return { ok: false, error: "perfil_inactivo" };
    }

    if (perfil.rol !== "admin" && perfil.rol !== "super_admin") {
      // Tiene login (alumno, docente) pero el panel actual es solo admin.
      // En fases futuras esta restriccion se afloja por ruta.
      await supabase.auth.signOut();
      return { ok: false, error: "sin_permisos" };
    }

    return { ok: true, user: data.user, perfil };
  } catch (err) {
    console.error("[auth] excepcion en iniciarSesion:", err);
    return { ok: false, error: "red" };
  }
}

export async function cerrarSesion(): Promise<void> {
  await supabase.auth.signOut();
}

export async function obtenerSesion(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function obtenerPerfil(userId: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, email, nombre, apellido, rol, activo, creado_en")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Perfil;
}

/**
 * Obtiene el perfil del usuario logueado (o null si no hay sesion).
 */
export async function obtenerPerfilActual(): Promise<Perfil | null> {
  const sesion = await obtenerSesion();
  if (!sesion?.user) return null;
  return obtenerPerfil(sesion.user.id);
}

/**
 * Guard para paginas protegidas. Devuelve el perfil si tiene acceso, o
 * redirige a /login con `?next=` apuntando a la URL actual si no.
 *
 * Uso tipico (dentro de un <script> de la pagina):
 *
 *   import { requerirAdmin } from '../lib/auth';
 *   const perfil = await requerirAdmin();
 *   if (!perfil) return; // ya redirigio
 *   // ... resto de la logica
 */
export async function requerirAdmin(): Promise<Perfil | null> {
  if (typeof window === "undefined") return null;

  const perfil = await obtenerPerfilActual();
  if (
    !perfil ||
    !perfil.activo ||
    (perfil.rol !== "admin" && perfil.rol !== "super_admin")
  ) {
    const next = window.location.pathname + window.location.search;
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
    return null;
  }
  return perfil;
}

/**
 * Devuelve el JWT actual (para llamar Edge Functions con `Authorization:
 * Bearer ...`). Null si no hay sesion.
 */
export async function obtenerAccessToken(): Promise<string | null> {
  const sesion = await obtenerSesion();
  return sesion?.access_token ?? null;
}

// ======================================================================
// Recuperacion / cambio de password
// ======================================================================

export interface ResultadoPassword {
  ok: boolean;
  error?:
    | "email_invalido"
    | "password_corta"
    | "password_iguales"
    | "no_autenticado"
    | "rate_limit"
    | "red"
    | "config";
  detalle?: string;
}

/**
 * Envia un mail al usuario con un link para restablecer su password.
 * El link apunta a /restablecer-password (la pagina detecta el token
 * automaticamente gracias a detectSessionInUrl: true).
 */
export async function solicitarResetPassword(
  email: string,
): Promise<ResultadoPassword> {
  const emailClean = email.trim().toLowerCase();
  if (!emailClean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
    return { ok: false, error: "email_invalido" };
  }

  try {
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/restablecer-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(emailClean, {
      redirectTo,
    });

    if (error) {
      const msg = (error.message ?? "").toLowerCase();
      if (msg.includes("rate") || msg.includes("limit")) {
        return { ok: false, error: "rate_limit", detalle: error.message };
      }
      // Por seguridad NO distinguimos "email no existe" del exito: igual
      // devolvemos ok para que un atacante no pueda enumerar usuarios.
      console.error("[auth.solicitarResetPassword]", error);
      return { ok: true };
    }
    return { ok: true };
  } catch (err) {
    console.error("[auth.solicitarResetPassword] excepcion:", err);
    return { ok: false, error: "red" };
  }
}

/**
 * Cambia la password del usuario logueado (requiere sesion activa, ya sea
 * porque acaba de venir del link de recovery o porque esta autenticado
 * normalmente desde el panel).
 */
export async function actualizarPassword(
  nueva: string,
): Promise<ResultadoPassword> {
  if (!nueva || nueva.length < 6) {
    return { ok: false, error: "password_corta" };
  }

  try {
    const { error } = await supabase.auth.updateUser({ password: nueva });
    if (error) {
      const msg = (error.message ?? "").toLowerCase();
      if (msg.includes("same") || msg.includes("different")) {
        return { ok: false, error: "password_iguales", detalle: error.message };
      }
      if (msg.includes("session") || msg.includes("auth")) {
        return { ok: false, error: "no_autenticado", detalle: error.message };
      }
      return { ok: false, error: "red", detalle: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("[auth.actualizarPassword] excepcion:", err);
    return { ok: false, error: "red" };
  }
}
