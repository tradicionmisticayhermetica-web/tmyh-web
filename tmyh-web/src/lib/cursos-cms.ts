import { cursos as cursosBase, type Curso } from "../data/cursos";
import { supabase } from "./supabase";

type EstadoCursoCms =
  | "borrador"
  | "activo"
  | "inactivo"
  | "proximo"
  | "historico"
  | "archivado";

interface CursoRow {
  id: string;
  slug: string;
  titulo: string;
  subtitulo: string | null;
  descripcion_corta: string;
  descripcion_larga: string[] | null;
  clases: number;
  modalidad: Curso["modalidad"];
  nivel: string;
  temas: unknown;
  inicio: string | null;
  duracion: string | null;
  estado: EstadoCursoCms;
  simbolo: string;
  precio_arg_efectivo: string | null;
  precio_arg_transferencia: string | null;
  precio_internacional_usd: string | null;
  precio_nota: string | null;
  inscripcion_email: string | null;
  inscripcion_whatsapp: string | null;
  inscripcion_link_mercadopago: string | null;
  inscripcion_paypal_user: string | null;
  inscripcion_cbu: string | null;
  inscripcion_alias: string | null;
  inscripcion_banco: string | null;
  inscripcion_cuit: string | null;
  anio_original: string | null;
  imagen: string | null;
  imagen_alt: string | null;
  programa_pdf: string | null;
  orden: number | null;
  publicado_en: string | null;
  eliminado_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface ResultadoGuardarCurso {
  ok: boolean;
  id?: string;
  slug?: string;
  error?: string;
}

function normalizarTemas(raw: unknown): Curso["temas"] {
  if (!Array.isArray(raw)) return [];
  const out: Curso["temas"] = [];
  for (const t of raw) {
    if (typeof t === "string") {
      const txt = t.trim();
      if (txt) out.push(txt);
      continue;
    }
    if (t && typeof t === "object" && "items" in t) {
      const titulo = String((t as any).titulo ?? "").trim();
      const itemsRaw = (t as any).items;
      const items = Array.isArray(itemsRaw)
        ? itemsRaw.map((x) => String(x ?? "").trim()).filter(Boolean)
        : [];
      if (titulo || items.length) {
        out.push({ titulo, items });
      }
    }
  }
  return out;
}

function estadoBdASitio(estado: EstadoCursoCms): Curso["estado"] | null {
  if (estado === "activo" || estado === "proximo" || estado === "historico") {
    return estado;
  }
  return null;
}

function cursoDesdeRow(row: CursoRow): Curso | null {
  const estado = estadoBdASitio(row.estado);
  if (!estado) return null;
  const descripcionLarga = (row.descripcion_larga ?? []).filter(Boolean);
  const temas = normalizarTemas(row.temas);
  return {
    slug: row.slug,
    titulo: row.titulo,
    subtitulo: row.subtitulo ?? undefined,
    descripcionCorta: row.descripcion_corta,
    descripcionLarga:
      descripcionLarga.length > 0
        ? descripcionLarga
        : ["Descripción en construcción."],
    clases: Math.max(1, row.clases || 1),
    modalidad: row.modalidad,
    nivel: row.nivel,
    temas,
    inicio: row.inicio ?? undefined,
    duracion: row.duracion ?? undefined,
    estado,
    simbolo: row.simbolo || "✦",
    precio:
      row.precio_arg_efectivo ||
      row.precio_arg_transferencia ||
      row.precio_internacional_usd ||
      row.precio_nota
        ? {
            argEfectivo: row.precio_arg_efectivo ?? undefined,
            argTransferencia: row.precio_arg_transferencia ?? undefined,
            internacionalUSD: row.precio_internacional_usd ?? undefined,
            nota: row.precio_nota ?? undefined,
          }
        : undefined,
    inscripcion:
      row.inscripcion_email ||
      row.inscripcion_whatsapp ||
      row.inscripcion_link_mercadopago ||
      row.inscripcion_paypal_user ||
      row.inscripcion_cbu ||
      row.inscripcion_alias ||
      row.inscripcion_banco ||
      row.inscripcion_cuit
        ? {
            email: row.inscripcion_email ?? undefined,
            whatsapp: row.inscripcion_whatsapp ?? undefined,
            linkMercadoPago: row.inscripcion_link_mercadopago ?? undefined,
            paypalUser: row.inscripcion_paypal_user ?? undefined,
            cbu: row.inscripcion_cbu ?? undefined,
            alias: row.inscripcion_alias ?? undefined,
            banco: row.inscripcion_banco ?? undefined,
            cuit: row.inscripcion_cuit ?? undefined,
          }
        : undefined,
    anioOriginal: row.anio_original ?? undefined,
    imagen: row.imagen ?? undefined,
    imagenAlt: row.imagen_alt ?? undefined,
    programaPdf: row.programa_pdf ?? undefined,
  };
}

export interface CursoEditable {
  id?: string;
  slug: string;
  titulo: string;
  subtitulo?: string;
  descripcionCorta: string;
  descripcionLarga: string[];
  clases: number;
  modalidad: Curso["modalidad"];
  nivel: string;
  temas: Curso["temas"];
  inicio?: string;
  duracion?: string;
  estado: EstadoCursoCms;
  simbolo: string;
  precio?: {
    argEfectivo?: string;
    argTransferencia?: string;
    internacionalUSD?: string;
    nota?: string;
  };
  inscripcion?: {
    email?: string;
    whatsapp?: string;
    linkMercadoPago?: string;
    paypalUser?: string;
    cbu?: string;
    alias?: string;
    banco?: string;
    cuit?: string;
  };
  anioOriginal?: string;
  imagen?: string;
  imagenAlt?: string;
  programaPdf?: string;
  orden?: number;
  eliminadoEn?: string | null;
}

function slugifySimple(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function editableDesdeCurso(curso: Curso): CursoEditable {
  return {
    slug: curso.slug,
    titulo: curso.titulo,
    subtitulo: curso.subtitulo,
    descripcionCorta: curso.descripcionCorta,
    descripcionLarga: curso.descripcionLarga,
    clases: curso.clases,
    modalidad: curso.modalidad,
    nivel: curso.nivel,
    temas: curso.temas,
    inicio: curso.inicio,
    duracion: curso.duracion,
    estado: curso.estado,
    simbolo: curso.simbolo,
    precio: curso.precio,
    inscripcion: curso.inscripcion,
    anioOriginal: curso.anioOriginal,
    imagen: curso.imagen,
    imagenAlt: curso.imagenAlt,
    programaPdf: curso.programaPdf,
    orden: 100,
    eliminadoEn: null,
  };
}

function editableDesdeRow(row: CursoRow): CursoEditable {
  return {
    id: row.id,
    slug: row.slug,
    titulo: row.titulo,
    subtitulo: row.subtitulo ?? undefined,
    descripcionCorta: row.descripcion_corta,
    descripcionLarga: row.descripcion_larga ?? [],
    clases: row.clases,
    modalidad: row.modalidad,
    nivel: row.nivel,
    temas: normalizarTemas(row.temas),
    inicio: row.inicio ?? undefined,
    duracion: row.duracion ?? undefined,
    estado: row.estado,
    simbolo: row.simbolo || "✦",
    precio: {
      argEfectivo: row.precio_arg_efectivo ?? undefined,
      argTransferencia: row.precio_arg_transferencia ?? undefined,
      internacionalUSD: row.precio_internacional_usd ?? undefined,
      nota: row.precio_nota ?? undefined,
    },
    inscripcion: {
      email: row.inscripcion_email ?? undefined,
      whatsapp: row.inscripcion_whatsapp ?? undefined,
      linkMercadoPago: row.inscripcion_link_mercadopago ?? undefined,
      paypalUser: row.inscripcion_paypal_user ?? undefined,
      cbu: row.inscripcion_cbu ?? undefined,
      alias: row.inscripcion_alias ?? undefined,
      banco: row.inscripcion_banco ?? undefined,
      cuit: row.inscripcion_cuit ?? undefined,
    },
    anioOriginal: row.anio_original ?? undefined,
    imagen: row.imagen ?? undefined,
    imagenAlt: row.imagen_alt ?? undefined,
    programaPdf: row.programa_pdf ?? undefined,
    orden: row.orden ?? 100,
    eliminadoEn: row.eliminado_en,
  };
}

export async function listarCursosAdminConFallback(): Promise<CursoEditable[]> {
  let data: CursoRow[] | null = null;
  let error: any = null;
  let sinColumnaEliminado = false;
  const q1 = await supabase
    .from("cursos")
    .select("*")
    .is("eliminado_en", null)
    .order("orden", { ascending: true })
    .order("titulo", { ascending: true });
  data = (q1.data as CursoRow[] | null) ?? null;
  error = q1.error;

  // Compatibilidad temporal: si la migración nueva aún no corrió y falta
  // eliminado_en en el schema cache, volvemos a consultar sin ese filtro.
  if (error && String(error.message ?? "").includes("eliminado_en")) {
    sinColumnaEliminado = true;
    const q2 = await supabase
      .from("cursos")
      .select("*")
      .order("orden", { ascending: true })
      .order("titulo", { ascending: true });
    data = (q2.data as CursoRow[] | null) ?? null;
    error = q2.error;
  }

  const porSlug = new Map<string, CursoEditable>();
  for (const c of cursosBase) porSlug.set(c.slug, editableDesdeCurso(c));

  if (!error && data) {
    for (const row of data as CursoRow[]) {
      // Compatibilidad sin eliminado_en: tratamos "archivado" como papelera
      // para que no aparezca en el listado principal.
      if (sinColumnaEliminado && row.estado === "archivado") continue;
      porSlug.set(row.slug, editableDesdeRow(row));
    }
  } else if (error) {
    console.error("[cursos-cms.listarCursosAdminConFallback]", error);
  }

  return Array.from(porSlug.values()).sort((a, b) => {
    const ao = Number.isFinite(a.orden) ? (a.orden as number) : 1000;
    const bo = Number.isFinite(b.orden) ? (b.orden as number) : 1000;
    if (ao !== bo) return ao - bo;
    return a.titulo.localeCompare(b.titulo, "es");
  });
}

export async function listarCursosPapelera(): Promise<CursoEditable[]> {
  const { data, error } = await supabase
    .from("cursos")
    .select("*")
    .not("eliminado_en", "is", null)
    .order("eliminado_en", { ascending: false });
  if (error) {
    // Compatibilidad sin eliminado_en: usamos estado=archivado como papelera.
    if (String(error.message ?? "").includes("eliminado_en")) {
      const alt = await supabase
        .from("cursos")
        .select("*")
        .eq("estado", "archivado")
        .order("actualizado_en", { ascending: false });
      if (alt.error) return [];
      return (alt.data as CursoRow[]).map(editableDesdeRow);
    }
    console.error("[cursos-cms.listarCursosPapelera]", error);
    return [];
  }
  return (data as CursoRow[]).map(editableDesdeRow);
}

export async function obtenerCursoEditable(
  slug: string,
): Promise<CursoEditable | null> {
  const slugTrim = slug.trim();
  if (!slugTrim) return null;

  const { data, error } = await supabase
    .from("cursos")
    .select("*")
    .eq("slug", slugTrim)
    .maybeSingle();

  if (data && !error) return editableDesdeRow(data as CursoRow);
  if (error) console.error("[cursos-cms.obtenerCursoEditable]", error);

  const base = cursosBase.find((c) => c.slug === slugTrim);
  return base ? editableDesdeCurso(base) : null;
}

export async function guardarCursoEditable(
  curso: CursoEditable,
): Promise<ResultadoGuardarCurso> {
  const payload = {
    slug: curso.slug,
    titulo: curso.titulo,
    subtitulo: curso.subtitulo?.trim() || null,
    descripcion_corta: curso.descripcionCorta,
    descripcion_larga: (curso.descripcionLarga ?? []).map((x) => x.trim()).filter(Boolean),
    clases: Math.max(1, curso.clases || 1),
    modalidad: curso.modalidad,
    nivel: curso.nivel,
    temas: curso.temas ?? [],
    inicio: curso.inicio?.trim() || null,
    duracion: curso.duracion?.trim() || null,
    estado: curso.estado,
    simbolo: curso.simbolo?.trim() || "✦",
    precio_arg_efectivo: curso.precio?.argEfectivo?.trim() || null,
    precio_arg_transferencia: curso.precio?.argTransferencia?.trim() || null,
    precio_internacional_usd: curso.precio?.internacionalUSD?.trim() || null,
    precio_nota: curso.precio?.nota?.trim() || null,
    inscripcion_email: curso.inscripcion?.email?.trim() || null,
    inscripcion_whatsapp: curso.inscripcion?.whatsapp?.trim() || null,
    inscripcion_link_mercadopago:
      curso.inscripcion?.linkMercadoPago?.trim() || null,
    inscripcion_paypal_user: curso.inscripcion?.paypalUser?.trim() || null,
    inscripcion_cbu: curso.inscripcion?.cbu?.trim() || null,
    inscripcion_alias: curso.inscripcion?.alias?.trim() || null,
    inscripcion_banco: curso.inscripcion?.banco?.trim() || null,
    inscripcion_cuit: curso.inscripcion?.cuit?.trim() || null,
    anio_original: curso.anioOriginal?.trim() || null,
    imagen: curso.imagen?.trim() || null,
    imagen_alt: curso.imagenAlt?.trim() || null,
    programa_pdf: curso.programaPdf?.trim() || null,
    orden: Number.isFinite(curso.orden) ? curso.orden : 100,
    publicado_en:
      curso.estado === "activo" ||
      curso.estado === "proximo" ||
      curso.estado === "historico"
        ? new Date().toISOString()
        : null,
  };

  const { data, error } = await supabase
    .from("cursos")
    .upsert(payload, { onConflict: "slug" })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[cursos-cms.guardarCursoEditable]", error);
    return { ok: false, error: error.message };
  }
  return { ok: true, id: (data as any)?.id, slug: curso.slug };
}

export async function moverCursoAPapelera(slug: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("mover_curso_a_papelera", {
    p_slug: slug,
  });
  if (error) {
    const msg = String(error.message ?? "");
    // Fallback por compatibilidad si la RPC aún no existe en producción.
    if (
      msg.includes("mover_curso_a_papelera") ||
      msg.includes("does not exist")
    ) {
      // Fallback: con o sin eliminado_en, al menos archivamos.
      const up = await supabase
        .from("cursos")
        .update({
          estado: "archivado",
          eliminado_en: new Date().toISOString(),
        } as any)
        .eq("slug", slug);
      if (up.error) {
        const msgUp = String(up.error.message ?? "");
        if (msgUp.includes("eliminado_en")) {
          const up2 = await supabase
            .from("cursos")
            .update({ estado: "archivado" })
            .eq("slug", slug);
          if (up2.error) return { ok: false, error: up2.error.message };
          return { ok: true };
        }
        return { ok: false, error: up.error.message };
      }
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }
  const r = data as any;
  if (!r?.ok) return { ok: false, error: r?.error ?? "error_rpc" };
  return { ok: true };
}

export async function restaurarCursoDePapelera(slug: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("restaurar_curso_desde_papelera", {
    p_slug: slug,
  });
  if (error) {
    const msg = String(error.message ?? "");
    if (
      msg.includes("restaurar_curso_desde_papelera") ||
      msg.includes("does not exist") ||
      msg.includes("eliminado_en")
    ) {
      const up = await supabase
        .from("cursos")
        .update({ estado: "inactivo" } as any)
        .eq("slug", slug);
      if (up.error) return { ok: false, error: up.error.message };
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }
  const r = data as any;
  if (!r?.ok) return { ok: false, error: r?.error ?? "error_rpc" };
  return { ok: true };
}

export async function eliminarCursoDefinitivo(slug: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("cursos")
    .delete()
    .eq("slug", slug);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function purgarCursosPapelera(): Promise<number> {
  const { data, error } = await supabase.rpc("purgar_cursos_papelera");
  if (error) {
    // Compatibilidad sin RPC/columna: no hacemos purge automática.
    const msg = String(error.message ?? "");
    if (
      msg.includes("purgar_cursos_papelera") ||
      msg.includes("does not exist") ||
      msg.includes("eliminado_en")
    ) {
      return 0;
    }
    console.error("[cursos-cms.purgarCursosPapelera]", error);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}

export async function dispararDeployCursos(
  razon: string,
): Promise<{ ok: boolean; error?: string }> {
  const payload = {
    table: "cursos",
    type: "UPDATE",
    record: {
      estado: "activo",
      slug: razon,
      id: `curso-${Date.now()}`,
    },
  };
  const { error } = await supabase.functions.invoke("trigger-build", {
    body: payload,
  });
  if (error) {
    console.error("[cursos-cms.dispararDeployCursos]", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function subirImagenCurso(file: File): Promise<{ ok: boolean; url?: string; error?: string }> {
  const maxBytes = 7 * 1024 * 1024;
  if (!file.type.startsWith("image/")) return { ok: false, error: "Solo se permiten imágenes." };
  if (file.size > maxBytes) return { ok: false, error: "La imagen supera 7 MB." };

  const base = slugifySimple(file.name.replace(/\.[^.]+$/, "")) || "imagen";
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `cursos/${Date.now()}-${base}.${ext}`;

  const { error: upError } = await supabase
    .storage
    .from("blog-images")
    .upload(path, file, { upsert: false, cacheControl: "3600" });
  if (upError) {
    console.error("[cursos-cms.subirImagenCurso] upload", upError);
    return { ok: false, error: upError.message };
  }
  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

/**
 * Fuente para páginas públicas:
 * - Base: `src/data/cursos.ts`
 * - Override: tabla `public.cursos`
 */
export async function listarCursosParaSitio(): Promise<Curso[]> {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
  if (!supabaseUrl || !anonKey) return cursosBase;

  try {
    const urlConEliminado =
      `${supabaseUrl}/rest/v1/cursos` +
      "?select=*" +
      "&eliminado_en=is.null" +
      "&estado=in.(activo,proximo,historico)" +
      "&order=orden.asc,titulo.asc";
    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    };
    let resp = await fetch(urlConEliminado, {
      headers,
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      // Compatibilidad: si la API aún no expone eliminado_en, reintentamos
      // sin ese filtro para no bloquear la generación de rutas públicas.
      if (txt.includes("eliminado_en")) {
        const urlSinEliminado =
          `${supabaseUrl}/rest/v1/cursos` +
          "?select=*" +
          "&estado=in.(activo,proximo,historico)" +
          "&order=orden.asc,titulo.asc";
        resp = await fetch(urlSinEliminado, { headers });
      }
    }
    if (!resp.ok) return cursosBase;

    const rows = (await resp.json()) as CursoRow[];
    const overrides = rows.map(cursoDesdeRow).filter(Boolean) as Curso[];
    const map = new Map<string, { curso: Curso; orden: number }>();
    cursosBase.forEach((c, i) => map.set(c.slug, { curso: c, orden: i + 1 }));
    for (const c of overrides) {
      const row = rows.find((r) => r.slug === c.slug);
      map.set(c.slug, { curso: c, orden: row?.orden ?? 1000 });
    }
    return Array.from(map.values())
      .sort((a, b) => {
        if (a.orden !== b.orden) return a.orden - b.orden;
        return a.curso.titulo.localeCompare(b.curso.titulo, "es");
      })
      .map((x) => x.curso);
  } catch (err) {
    console.error("[cursos-cms.listarCursosParaSitio]", err);
    return cursosBase;
  }
}
