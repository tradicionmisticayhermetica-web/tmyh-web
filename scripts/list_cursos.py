#!/usr/bin/env python3
"""Lista cursos distintos en public.inscripciones con su conteo de alumnos."""
from __future__ import annotations

import os
import sys
from collections import Counter
from pathlib import Path

import requests


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
    headers = {"apikey": key, "Authorization": f"Bearer {key}",
               "Range-Unit": "items"}
    rest = f"{url}/rest/v1"

    all_rows: list[dict] = []
    page = 1000
    offset = 0
    while True:
        r = requests.get(
            f"{rest}/inscripciones"
            f"?select=nombre_curso,fuente,contacto_id"
            f"&offset={offset}&limit={page}",
            headers=headers, timeout=120,
        )
        r.raise_for_status()
        rows = r.json()
        if not rows:
            break
        all_rows.extend(rows)
        if len(rows) < page:
            break
        offset += page

    counter: Counter = Counter()
    by_fuente: dict[str, Counter] = {}
    for r in all_rows:
        c = r["nombre_curso"]
        counter[c] += 1
        by_fuente.setdefault(r["fuente"], Counter())[c] += 1

    print(f"Total inscripciones: {len(all_rows)}")
    print(f"Cursos distintos:    {len(counter)}")
    print()
    print(f"{'alumnos':>7}  curso")
    print("-" * 90)
    for curso, n in counter.most_common():
        print(f"{n:>7}  {curso}")


if __name__ == "__main__":
    main()
