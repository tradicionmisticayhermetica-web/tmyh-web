#!/usr/bin/env python3
"""
Lista detallada de todos los contactos que el cleanup borraria.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import requests


SPAM_EMAIL_PATTERNS = [
    "%@%.ru", "%@%.su",
    "%@intermediate-website.store",
    "%@mail.com", "%@inbox.ru",
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
    load_env(Path(".env"))
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    rest = f"{url}/rest/v1"

    found: dict[str, dict] = {}
    for pat in SPAM_EMAIL_PATTERNS:
        r = requests.get(
            f"{rest}/contactos"
            f"?select=id,email,nombre,apellido,creado_en,notas"
            f"&email=ilike.{pat}",
            headers=headers, timeout=60,
        )
        r.raise_for_status()
        for row in r.json():
            found[row["id"]] = row

    rows = sorted(found.values(), key=lambda r: r["email"])
    print(f"\n{'#':>3}  {'email':<42}  {'nombre':<20} {'apellido':<20} cursos")
    print("-" * 110)
    for i, c in enumerate(rows, 1):
        ins = requests.get(
            f"{rest}/inscripciones?select=nombre_curso,fuente&contacto_id=eq.{c['id']}",
            headers=headers, timeout=60,
        ).json()
        cursos_str = f"{len(ins)} inscripciones"
        if ins:
            sample = ins[0]["nombre_curso"][:40]
            cursos_str += f"  (ej: {sample})"
        print(f"{i:>3}  {c['email']:<42}  "
              f"{(c.get('nombre') or '')[:20]:<20} "
              f"{(c.get('apellido') or '')[:20]:<20} {cursos_str}")

    print(f"\nTotal: {len(rows)} contactos")


if __name__ == "__main__":
    main()
