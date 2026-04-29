#!/usr/bin/env python3
"""
Sube el CSV data/usuarios-wordpress.csv a Supabase.

Hace dos cosas por fila:
  1) UPSERT en public.contactos por email (merge-duplicates).
  2) Si la fila tiene 'curso' no vacio, inserta en public.inscripciones
     (contacto_id, nombre_curso, fuente) con on_conflict para no duplicar.

Requisitos:
  pip install requests python-dotenv

Credenciales (.env en la raiz del proyecto, NO commitear):
  SUPABASE_URL=https://<tu-proyecto>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<service_role_secret>

Uso:
  py scripts/upload_contactos_to_supabase.py data/usuarios-wordpress.csv
"""
from __future__ import annotations

import csv
import os
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("Falta 'requests'. Instala con:  pip install requests python-dotenv",
          file=sys.stderr)
    sys.exit(1)


def load_env(env_path: Path) -> None:
    """Minimal .env loader (sin depender de python-dotenv)."""
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        os.environ.setdefault(k, v)


def _parse_ts(s: str) -> str | None:
    s = (s or "").strip()
    if not s or s.startswith("0000-00-00"):
        return None
    return s.replace(" ", "T") + "+00:00"


def main() -> None:
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 \
        else Path("data/usuarios-wordpress.csv")
    if not csv_path.is_file():
        print(f"No existe el CSV: {csv_path}", file=sys.stderr)
        sys.exit(1)

    load_env(Path(".env"))
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        print("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env",
              file=sys.stderr)
        sys.exit(1)

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates",
    }

    rest = f"{url}/rest/v1"
    BATCH = 500

    def post_batched(endpoint: str, payload: list[dict], label: str) -> list[dict]:
        out: list[dict] = []
        total = len(payload)
        for i in range(0, total, BATCH):
            chunk = payload[i:i + BATCH]
            r = requests.post(
                f"{rest}/{endpoint}",
                headers=headers,
                json=chunk,
                timeout=120,
            )
            if not r.ok:
                print(f"Error {label} (lote {i // BATCH + 1}): "
                      f"{r.status_code} {r.text}", file=sys.stderr)
                sys.exit(1)
            got = r.json()
            out.extend(got)
            print(f"  {label}: {min(i + BATCH, total):>5}/{total}")
        return out

    with csv_path.open("r", encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    print(f"Filas en CSV: {len(rows)}")

    contactos_by_email: dict[str, dict] = {}
    for r in rows:
        email = (r.get("email") or "").strip().lower()
        if not email:
            continue
        prev = contactos_by_email.get(email, {})
        contactos_by_email[email] = {
            "email": email,
            "nombre":   (r.get("nombre")   or "").strip() or prev.get("nombre"),
            "apellido": (r.get("apellido") or "").strip() or prev.get("apellido"),
            "telefono": (r.get("telefono") or "").strip() or prev.get("telefono"),
            "notas":    (r.get("notas")    or "").strip() or prev.get("notas"),
        }

    contactos_payload = list(contactos_by_email.values())
    print(f"Contactos unicos a upsertar: {len(contactos_payload)}")
    print("UPSERT contactos ...")
    inserted = post_batched(
        "contactos?on_conflict=email", contactos_payload, "contactos"
    )
    print(f"Contactos upserted: {len(inserted)}")

    email_to_id: dict[str, str] = {c["email"].lower(): c["id"] for c in inserted}

    inscripciones_seen: set[tuple[str, str, str]] = set()
    inscripciones_payload: list[dict] = []
    for r in rows:
        curso = (r.get("curso") or "").strip()
        if not curso:
            continue
        email = (r.get("email") or "").strip().lower()
        cid = email_to_id.get(email)
        if not cid:
            continue
        fuente = (r.get("fuente") or "wordpress:um").strip()
        key = (cid, curso, fuente)
        if key in inscripciones_seen:
            continue
        inscripciones_seen.add(key)
        inscripciones_payload.append({
            "contacto_id": cid,
            "nombre_curso": curso,
            "fuente": fuente,
        })

    if inscripciones_payload:
        print(f"UPSERT inscripciones ({len(inscripciones_payload)}) ...")
        done = post_batched(
            "inscripciones?on_conflict=contacto_id,nombre_curso,fuente",
            inscripciones_payload,
            "inscripciones",
        )
        print(f"Inscripciones upserted: {len(done)}")
    else:
        print("Sin cursos en el CSV -> no se crean inscripciones esta vez.")

    print("OK.")


if __name__ == "__main__":
    main()
