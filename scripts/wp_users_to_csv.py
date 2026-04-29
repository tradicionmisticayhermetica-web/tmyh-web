#!/usr/bin/env python3
"""
Parsea database.sql de All-in-One WP Migration y genera un CSV con los
usuarios de WordPress (Ultimate Member), listo para importar a Supabase.

Salida (data/usuarios-wordpress.csv):
  email, nombre, apellido, telefono, fuente, curso, notas, fecha_registro

- email, nombre, apellido: desde wp_users + usermeta (first_name, last_name).
- telefono: vacio (Ultimate Member no lo tenia activo en este WP).
- fuente: 'wordpress:um'.
- curso: vacio (se completa luego segun inscripciones).
- notas: 'user_login=... ; display_name=...' para trazabilidad.
- fecha_registro: user_registered.

Uso:
  py scripts/wp_users_to_csv.py wp-extracted/database.sql data/usuarios-wordpress.csv
"""
from __future__ import annotations

import csv
import re
import sys
from pathlib import Path


USERS_RE = re.compile(
    r"INSERT INTO `SERVMASK_PREFIX_users` VALUES \((.*?)\);",
    re.DOTALL,
)
META_RE = re.compile(
    r"INSERT INTO `SERVMASK_PREFIX_usermeta` VALUES \(\d+,(\d+),'([^']+)',(.*?)\);",
    re.DOTALL,
)


def _split_sql_row(row: str) -> list[str]:
    """
    Divide una fila VALUES(...) en sus campos.
    Maneja comillas simples escapadas con \' y backslashes dobles.
    """
    out: list[str] = []
    buf: list[str] = []
    in_str = False
    i = 0
    while i < len(row):
        c = row[i]
        if in_str:
            if c == "\\" and i + 1 < len(row):
                buf.append(row[i + 1])
                i += 2
                continue
            if c == "'":
                in_str = False
                i += 1
                continue
            buf.append(c)
            i += 1
            continue
        if c == "'":
            in_str = True
            i += 1
            continue
        if c == ",":
            out.append("".join(buf).strip())
            buf = []
            i += 1
            continue
        buf.append(c)
        i += 1
    out.append("".join(buf).strip())
    return out


def _unquote_value(s: str) -> str:
    s = s.strip()
    if s.startswith("'") and s.endswith("'"):
        s = s[1:-1]
    return s.replace("\\'", "'").replace("\\\\", "\\")


def parse_users(sql_text: str) -> dict[int, dict[str, str]]:
    users: dict[int, dict[str, str]] = {}
    for m in USERS_RE.finditer(sql_text):
        parts = _split_sql_row(m.group(1))
        if len(parts) < 10:
            continue
        try:
            uid = int(parts[0])
        except ValueError:
            continue
        users[uid] = {
            "user_login":      parts[1],
            "user_email":      parts[4],
            "user_registered": parts[6],
            "display_name":    parts[9],
        }
    return users


def parse_meta(sql_text: str, keys: set[str]) -> dict[int, dict[str, str]]:
    out: dict[int, dict[str, str]] = {}
    for m in META_RE.finditer(sql_text):
        uid = int(m.group(1))
        key = m.group(2)
        if key not in keys:
            continue
        raw = m.group(3).strip()
        if raw == "NULL":
            val = ""
        else:
            val = _unquote_value(raw)
        out.setdefault(uid, {})[key] = val
    return out


def main() -> None:
    if len(sys.argv) < 3:
        print("Uso: py scripts/wp_users_to_csv.py <database.sql> <salida.csv>",
              file=sys.stderr)
        sys.exit(1)

    sql_path = Path(sys.argv[1])
    csv_path = Path(sys.argv[2])
    csv_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Leyendo {sql_path} ...")
    text = sql_path.read_text(encoding="utf-8", errors="replace")

    users = parse_users(text)
    print(f"Usuarios encontrados: {len(users)}")

    meta = parse_meta(text, {"first_name", "last_name", "full_name"})

    rows: list[dict[str, str]] = []
    for uid, u in users.items():
        m = meta.get(uid, {})
        first = m.get("first_name", "").strip()
        last = m.get("last_name", "").strip()

        if not first and not last and m.get("full_name"):
            fn = m["full_name"].strip()
            if " " in fn:
                first, last = fn.split(" ", 1)
            else:
                first = fn

        if not first and not last and u.get("display_name"):
            dn = u["display_name"].strip()
            if " " in dn:
                first, last = dn.split(" ", 1)
            else:
                first = dn

        email = (u.get("user_email") or "").strip().lower()
        if not email or "@" not in email:
            continue

        rows.append({
            "email": email,
            "nombre": first,
            "apellido": last,
            "telefono": "",
            "fuente": "wordpress:um",
            "curso": "",
            "notas": f"user_login={u.get('user_login','')}; display_name={u.get('display_name','')}",
            "fecha_registro": u.get("user_registered", ""),
        })

    rows.sort(key=lambda r: r["email"])
    seen: dict[str, dict[str, str]] = {}
    for r in rows:
        seen[r["email"]] = r
    rows = list(seen.values())

    fields = ["email", "nombre", "apellido", "telefono",
              "fuente", "curso", "notas", "fecha_registro"]
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(r)

    print(f"CSV escrito: {csv_path.resolve()}")
    print(f"Filas: {len(rows)}")


if __name__ == "__main__":
    main()
