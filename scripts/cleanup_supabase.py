#!/usr/bin/env python3
"""
Limpieza de spam en public.contactos.

Borra por email matcheando dominios/patrones conocidos de spam.
Las inscripciones asociadas se borran solas por ON DELETE CASCADE.

Modos:
  dry-run (default): solo muestra que pasaria.
  apply:            ejecuta el DELETE.

Uso:
  py scripts/cleanup_supabase.py             # dry run
  py scripts/cleanup_supabase.py --apply     # ejecuta
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import requests


SPAM_EMAIL_PATTERNS: list[tuple[str, str]] = [
    ("dominio .ru",                  "*@*.ru"),
    ("dominio .su",                  "*@*.su"),
    ("intermediate-website.store",   "*@intermediate-website.store"),
    ("mail.com (sospechoso)",        "*@mail.com"),
    ("inbox.ru",                     "*@inbox.ru"),
]


def load_env(env_path: Path) -> None:
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def main() -> None:
    apply = "--apply" in sys.argv

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
        "Prefer": "return=representation,count=exact",
    }
    rest = f"{url}/rest/v1"

    print(f"Modo: {'APPLY (borra)' if apply else 'DRY-RUN (solo muestra)'}")
    print()

    all_rows: list[dict] = []

    for label, pattern in SPAM_EMAIL_PATTERNS:
        ilike = pattern.replace("*", "%")
        q = f"{rest}/contactos?select=id,email,nombre,apellido&email=ilike.{ilike}"
        r = requests.get(q, headers=headers, timeout=60)
        if not r.ok:
            print(f"Error consultando {label}: {r.status_code} {r.text}",
                  file=sys.stderr)
            sys.exit(1)
        rows = r.json()
        print(f"[{label:32}]  match: {len(rows):>4}")
        for row in rows[:5]:
            print(f"    - {row['email']:<45}  "
                  f"{(row.get('nombre') or ''):<20} "
                  f"{(row.get('apellido') or '')}")
        if len(rows) > 5:
            print(f"    ... y {len(rows) - 5} mas")
        all_rows.extend(rows)

    unique = {r["id"]: r for r in all_rows}
    print()
    print(f"Total contactos a borrar (unicos): {len(unique)}")

    if not unique:
        print("Nada que borrar.")
        return

    if not apply:
        print()
        print("Esto fue un dry-run. Para borrar de verdad, correr:")
        print("  py scripts/cleanup_supabase.py --apply")
        return

    print()
    print("Borrando ...")
    ids = list(unique.keys())
    BATCH = 200
    total_deleted = 0
    for i in range(0, len(ids), BATCH):
        chunk = ids[i:i + BATCH]
        q_ids = ",".join(chunk)
        r = requests.delete(
            f"{rest}/contactos?id=in.({q_ids})",
            headers=headers,
            timeout=120,
        )
        if not r.ok:
            print(f"Error borrando (lote {i // BATCH + 1}): "
                  f"{r.status_code} {r.text}", file=sys.stderr)
            sys.exit(1)
        deleted = r.json() if r.text else []
        total_deleted += len(deleted)
        print(f"  borrados {min(i + BATCH, len(ids))}/{len(ids)}")

    print()
    print(f"OK. Contactos borrados: {total_deleted}")
    print("(Sus inscripciones se borraron solas por ON DELETE CASCADE.)")


if __name__ == "__main__":
    main()
