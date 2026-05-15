"""
recortar_caduceo.py
===================
Recorta el fondo del PNG generado por IA dejando solo el caduceo con
canal alfa real. Detecta pixeles "neutros y claros" (sin tono de color,
alta luminosidad) y los hace transparentes -- sirve tanto para el fondo
exterior como para los huecos internos del simbolo (espacios entre las
espirales de las serpientes y el baston).

La logica clave: el caduceo es siempre dorado/bronce (con saturacion de
color > 0), mientras que el fondo blanco/gris es neutro (R == G == B).
Esa diferencia nos permite distinguir sin tener que hacer flood fill,
asi capturamos tambien los huecos internos.

Uso:
    python scripts/recortar_caduceo.py

Lee y sobrescribe: tmyh-web/src/assets/images/caduceo-fondo.png
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

# Path absoluto al PNG dentro del proyecto Astro.
RAIZ = Path(__file__).resolve().parent.parent
IMG_PATH = RAIZ / "tmyh-web" / "src" / "assets" / "images" / "caduceo-fondo.png"

# Tolerancia de saturacion: maxima diferencia entre canal max y min de
# RGB para considerar el pixel "neutro" (sin tono dorado). El fondo
# blanco/gris tiene diferencia ~0-5; el dorado bronce del caduceo, ~30+.
TOL_SATURACION = 22

# Luminosidad minima para que un pixel neutro califique como fondo. Los
# pixeles neutros oscuros (sombras profundas) NO son fondo, son detalle.
TOL_LUMINOSIDAD = 175

# Blur del canal alpha al final, en pixeles. 0.5-1.5 suaviza los bordes
# duros del recorte sin "desenfocar" el caduceo.
ALPHA_BLUR = 0.7


def main() -> None:
    print(f"Procesando: {IMG_PATH}")
    if not IMG_PATH.exists():
        raise SystemExit(f"No existe: {IMG_PATH}")

    img = Image.open(IMG_PATH).convert("RGBA")
    print(f"  modo entrada: {img.mode}, tamano: {img.size}")

    arr = np.array(img)
    h, w = arr.shape[:2]
    rgb = arr[:, :, :3].astype(np.int32)

    # Saturacion: diferencia entre canal mas alto y mas bajo de cada
    # pixel. Pixeles "neutros" (grises, blancos) tienen saturacion ~0.
    saturacion = np.max(rgb, axis=2) - np.min(rgb, axis=2)

    # Luminosidad ponderada (formula clasica YUV).
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    luminosidad = 0.299 * r + 0.587 * g + 0.114 * b

    # Mascara: True = pixel a hacer transparente.
    es_fondo = (saturacion < TOL_SATURACION) & (luminosidad > TOL_LUMINOSIDAD)

    pixeles_fondo = int(es_fondo.sum())
    print(
        f"  pixels marcados como fondo: {pixeles_fondo:,} "
        f"de {h * w:,} ({100 * pixeles_fondo / (h * w):.1f}%)"
    )

    # Aplicar alpha 0 en el fondo.
    arr[:, :, 3][es_fondo] = 0

    result = Image.fromarray(arr, mode="RGBA")

    # Suavizar el borde del recorte (anti-aliasing). Blur SOLO sobre el
    # canal alpha para no afectar los colores del caduceo.
    if ALPHA_BLUR > 0:
        alpha = result.getchannel("A")
        alpha_smoothed = alpha.filter(ImageFilter.GaussianBlur(radius=ALPHA_BLUR))
        result.putalpha(alpha_smoothed)

    result.save(IMG_PATH, format="PNG", optimize=True)
    print(f"Guardado: {IMG_PATH} ({IMG_PATH.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
