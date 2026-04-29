#!/usr/bin/env python3
"""
Extrae un archivo .wpress (All-in-One WP Migration / ServMask) a una carpeta.

Formato del archivo .wpress (documentado por ServMask):
  - Secuencia de bloques. Cada bloque empieza con un header de 4377 bytes:
      * 255 bytes : nombre de archivo (null-padded)
      *  14 bytes : tamano en bytes (ASCII decimal)
      *  12 bytes : mtime (ASCII decimal, epoch)
      * 4096 bytes: ruta relativa del directorio
  - Tras el header vienen exactamente <tamano> bytes de contenido.
  - El fin de archivo se marca con un header de 4377 bytes todo a 0x00.

Uso:
  python extract_wpress.py <archivo.wpress> [carpeta_destino]

Si no se indica carpeta_destino, se crea una con el mismo nombre que el .wpress
pero sin extension, junto al archivo.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

HEADER_SIZE = 4377
NAME_SIZE = 255
SIZE_SIZE = 14
MTIME_SIZE = 12
PREFIX_SIZE = 4096
EOF_HEADER = b"\x00" * HEADER_SIZE
CHUNK = 1024 * 1024


def _clean(b: bytes) -> str:
    return b.split(b"\x00", 1)[0].decode("utf-8", errors="replace").strip()


def extract(wpress_path: Path, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    total_bytes = wpress_path.stat().st_size
    count = 0

    with wpress_path.open("rb") as f:
        while True:
            header = f.read(HEADER_SIZE)
            if len(header) < HEADER_SIZE or header == EOF_HEADER:
                break

            name = _clean(header[0:NAME_SIZE])
            size_txt = _clean(header[NAME_SIZE:NAME_SIZE + SIZE_SIZE])
            prefix = _clean(
                header[NAME_SIZE + SIZE_SIZE + MTIME_SIZE:
                       NAME_SIZE + SIZE_SIZE + MTIME_SIZE + PREFIX_SIZE]
            )

            try:
                size = int(size_txt) if size_txt else 0
            except ValueError:
                print(f"Tamano invalido para {name!r}: {size_txt!r}", file=sys.stderr)
                return

            if not name:
                if size > 0:
                    f.seek(size, os.SEEK_CUR)
                continue

            rel = Path(prefix) / name if prefix else Path(name)
            dest = out_dir / rel
            dest.parent.mkdir(parents=True, exist_ok=True)

            if dest.is_dir():
                if size > 0:
                    f.seek(size, os.SEEK_CUR)
                continue

            remaining = size
            with dest.open("wb") as out:
                while remaining > 0:
                    chunk = f.read(min(CHUNK, remaining))
                    if not chunk:
                        print(f"EOF inesperado leyendo {rel}", file=sys.stderr)
                        return
                    out.write(chunk)
                    remaining -= len(chunk)

            count += 1
            if count % 200 == 0:
                pos = f.tell()
                pct = (pos / total_bytes) * 100 if total_bytes else 0
                print(f"  ...{count} archivos extraidos ({pct:5.1f}% del .wpress)")

    print(f"\nOK. Archivos extraidos: {count}")
    print(f"Destino: {out_dir.resolve()}")


def main() -> None:
    if len(sys.argv) < 2:
        print("Uso: python extract_wpress.py <archivo.wpress> [carpeta_destino]",
              file=sys.stderr)
        sys.exit(1)

    wpress = Path(sys.argv[1]).expanduser().resolve()
    if not wpress.is_file():
        print(f"No existe el archivo: {wpress}", file=sys.stderr)
        sys.exit(1)

    if len(sys.argv) >= 3:
        out = Path(sys.argv[2]).expanduser().resolve()
    else:
        out = wpress.with_suffix("")

    print(f"Extrayendo {wpress.name} -> {out}")
    extract(wpress, out)


if __name__ == "__main__":
    main()
