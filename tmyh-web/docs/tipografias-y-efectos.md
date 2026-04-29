# Tipografías y efectos — TM&H

Referencia técnica con nombres oficiales y enlaces para poder buscar cada
elemento por tu cuenta. Complementa a `frontend.md` (que explica las
decisiones en lenguaje llano); acá están los **nombres técnicos** que
googleás tal cual.

---

## Tipografías

Definidas en `src/styles/global.css` (líneas 33-35) y cargadas desde
Google Fonts en `src/layouts/BaseLayout.astro`.

### 1. Cinzel — títulos y display

- **Dónde**: todos los `h1`, `h2`, `h3`, `h4`, el logo del header, los
  "eyebrows" (antetítulos).
- **Qué es**: tipografía inspirada en inscripciones lapidarias romanas
  del siglo I. Sólo mayúsculas, basada en los grabados de la **Columna
  de Trajano** (Roma, 113 d.C.). Diseñada por **Natanael Gama** en 2012.
- **Enlace oficial**: [fonts.google.com/specimen/Cinzel](https://fonts.google.com/specimen/Cinzel)
- **Pesos que usamos**: 400 (regular) y 500 (medium).
- **Por qué**: le da el aire "grabado en piedra / lapidario hermético"
  al sitio.

### 2. Cormorant Garamond — cuerpo de lectura

- **Dónde**: todos los párrafos largos, citas, descripciones. Es la
  clase `font-serif` del sitio.
- **Qué es**: serif de display basada en los diseños de **Claude
  Garamond** (tipógrafo francés del siglo XVI, uno de los padres de la
  tipografía occidental moderna). Versión contemporánea diseñada por
  **Christian Thalmann**. Tiene contraste alto y rasgos humanísticos
  muy elegantes.
- **Enlace oficial**: [fonts.google.com/specimen/Cormorant+Garamond](https://fonts.google.com/specimen/Cormorant+Garamond)
- **Pesos que usamos**: 400 regular + cursiva.
- **Por qué**: tradición editorial clásica, como de libro antiguo, sin
  caer en la ubicuidad de Times New Roman.

### 3. Inter — interfaz y microtexto

- **Dónde**: botones (`btn-gold`, `btn-ghost`), links del menú,
  antetítulos, formulario, badges, breadcrumbs. Es la `font-sans`.
- **Qué es**: sans-serif diseñada por **Rasmus Andersson** en 2016,
  optimizada específicamente para pantallas y UI. Usada en miles de
  productos web modernos (Figma, Notion, Linear, GitHub, etc.).
- **Enlace oficial**: [rsms.me/inter](https://rsms.me/inter/) · [Google Fonts](https://fonts.google.com/specimen/Inter)
- **Pesos que usamos**: 400 (regular) y 500 (medium).
- **Detalle fino**: la tenemos con `font-feature-settings: "ss01", "cv11"`
  en el `body` (global.css línea 54). Esto activa dos **Stylistic Sets**
  de Inter que pasan la `a` y la `g` de doble piso a variantes de un
  solo piso, más limpias para UI. Buscá **"Inter stylistic sets"** si te
  interesa.

---

## Tamaños de texto (desktop ≥1024 px)

| Elemento | Font | Tamaño | Clase Tailwind |
|---|---|---|---|
| H1 hero | Cinzel 500 | 36–60 px | `text-4xl md:text-6xl` |
| H2 sección | Cinzel 500 | 30–36 px | `text-3xl md:text-4xl` |
| H3 | Cinzel 400 | 20–24 px | `text-xl md:text-2xl` |
| Cuerpo principal | Cormorant 400 | **21.6 px** | `text-lg font-serif` |
| Citas / secundarios | Cormorant 400 | **18.4 px** | `text-base font-serif` |
| Eyebrow (antetítulo) | Inter 500 | 11.5 px | `.title-eyebrow` |
| Links del menú | Inter 500 | 12.5 px | `.nav-link` |
| Botones | Inter 500 | 12.5 px | `.btn-gold`, `.btn-ghost` |
| Microtexto / figcaption | Inter / Cormorant | 10–12 px | `text-[10px]`, `text-xs` |

### Ajuste fino en desktop

El bloque en `global.css` líneas 240-252 sube el cuerpo de lectura
sólo en pantallas ≥1024 px y agrega un letter-spacing casi
imperceptible. Es un truco clásico de lectura larga conocido como
**"letter-spacing for legibility"** o **"optical kerning adjustment"**.
Referencia: [Butterick's Practical Typography — Letterspacing](https://practicaltypography.com/letterspacing.html).

```css
@media (min-width: 1024px) {
  .text-lg.font-serif {
    font-size: 1.35rem;
    line-height: 1.8;
    letter-spacing: 0.012em;
  }
  .text-base.font-serif {
    font-size: 1.15rem;
    line-height: 1.75;
    letter-spacing: 0.01em;
  }
}
```

---

## Efectos de "iluminación" (nombres técnicos)

No usamos ninguna librería externa. Todo está en CSS nativo. Los nombres
técnicos sirven para googlear cada efecto y aprender a replicarlo en
otros proyectos.

### Botones dorados (`btn-gold`)

Archivo: `src/styles/global.css` líneas 130-151.

- **Gradient fill**: `linear-gradient` vertical sobre el fondo.
- **Inset highlight**: `box-shadow ... inset` con blanco al 15% →
  simula luz superior, como metal pulido. Buscar: **"CSS inset shadow
  highlight"**, **"CSS metallic button"**.
- **Glow / "bloom"**: `box-shadow` externo con el dorado al 50% y blur
  grande → halo ambarino alrededor. Buscar: **"CSS glow button"**,
  **"CSS bloom effect"**.
- **Lift on hover**: `transform: translateY(-1px)` → el botón "se
  levanta" 1 px cuando pasás el mouse.

### Menú superior (`.nav-link`)

Archivo: `src/components/Navbar.astro` líneas 79-140.

- **Text glow** (el resplandor detrás de las letras al hacer hover):
  múltiples `text-shadow` apilados. Técnica: **"CSS text glow"** o
  **"CSS soft neon text effect"** (acá en versión suave y dorada, no
  neón saturado). Referencia:
  [CSS-Tricks — Glowing text](https://css-tricks.com/almanac/properties/t/text-shadow/).
- **Center-out underline** (la línea dorada debajo que se expande
  desde el centro hacia los lados): pseudo-elemento `::after` con
  `left: 50%; right: 50%` animando a `left: 0; right: 0`. Patrón
  clásico, buscar **"CSS underline animation center out"** o
  **"expanding underline from center"**. Referencia:
  [CodyHouse — Underline animations](https://codyhouse.co/gem/css-link-animation/).
- **Curva de animación**: `cubic-bezier(0.4, 0, 0.2, 1)` es la
  **"standard easing"** de Material Design, también llamada
  **"fast out, slow in"** o **"ease-in-out"** personalizada.
  Visualizador: [cubic-bezier.com](https://cubic-bezier.com).

### Tarjetas "altar" (`.card-altar`)

Archivo: `src/styles/global.css` líneas 175-187.

- **Glassmorphism**: `backdrop-filter: blur(4px)` + fondo
  semitransparente. Técnica popularizada por Apple con macOS Big Sur
  (2020). Buscar: **"glassmorphism CSS"**. Generador:
  [glassmorphism.com](https://glassmorphism.com).
- **Hover lift + dual shadow**: `translateY(-4px)` combinado con
  doble `box-shadow` (una sombra oscura baja para profundidad + un
  halo dorado difuso para ambiente). Buscar: **"CSS card hover
  lift"**, **"CSS layered shadows"**.

### Imágenes atmosféricas (`.img-altar`)

Archivo: `src/styles/global.css` líneas 260-295.

- **Combined filters**: `filter: grayscale() sepia() brightness() contrast()`
  → le da ese aire de "foto antigua" unificando grabados históricos
  con fotos modernas. Buscar: **"CSS sepia filter photography"**,
  **"CSS photo vintage effect"**.
- **Dual-layer shadow**: una sombra dura hacia abajo para profundidad
  + una sombra dorada difusa que funciona como **"rim light"** o
  **"ambient glow"** (términos prestados del 3D/cine).
- **Hover reveal**: al pasar el mouse, los filtros se atenúan (la
  foto "revive" en color). Buscar: **"CSS image hover color
  reveal"**.

### Fondos del sitio

Archivo: `src/styles/global.css` líneas 50-63 y 208-221.

- **Atmospheric gradient background** (los halos dorado y granate del
  fondo general): superposición de `radial-gradient` muy difusos.
  Técnica común en landing pages modernas. Buscar: **"CSS
  atmospheric gradient"**, **"CSS spotlight background"**.
- **Procedural star field** (el fondo estrellado de los heros): seis
  `radial-gradient` muy chiquititos superpuestos, cada uno es una
  "estrella" fija. Buscar: **"CSS stars background"**, **"CSS
  procedural stars"**. Referencia:
  [Saul Hardman — CSS stars](https://saulhardman.com/blog/pure-css-stars-background/).

### Animación `soft-pulse`

Archivo: `src/styles/global.css` líneas 223-231.

- Keyframe de 4 segundos que oscila la opacidad entre 0.6 y 1.
- Nombre genérico: **"CSS breathing animation"** o **"CSS pulse
  animation"** (la versión lenta y contemplativa, no la cardíaca).
- Hoy no está aplicada en ningún elemento; queda disponible.

### Selección de texto

Archivo: `src/styles/global.css` líneas 75-78.

- Cuando el usuario selecciona texto con el mouse, el fondo se vuelve
  dorado y las letras negras. Se controla con el pseudo-elemento
  `::selection`. Buscar: **"CSS ::selection pseudo element"**,
  **"custom text selection color"**. Detalle finito que casi nadie
  retoca.

---

## Recursos recomendados para estudiar

### CSS y diseño visual

- [MDN Web Docs — box-shadow](https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow):
  referencia oficial de sombras y halos.
- [Josh Comeau — Designing Beautiful Shadows in CSS](https://www.joshwcomeau.com/css/designing-shadows/):
  artículo clásico sobre profundidad con sombras. Muy recomendado.
- [Josh Comeau — An Interactive Guide to CSS Transitions](https://www.joshwcomeau.com/animation/css-transitions/):
  todo sobre transiciones y easing.
- [CSS Tricks — The Shapes of CSS](https://css-tricks.com/the-shapes-of-css/):
  librería de formas hechas con pseudo-elementos.

### Tipografía

- [Butterick's Practical Typography](https://practicaltypography.com/):
  biblia gratis online de tipografía aplicada. Capítulos recomendados:
  [Typography in ten minutes](https://practicaltypography.com/typography-in-ten-minutes.html),
  [Summary of key rules](https://practicaltypography.com/summary-of-key-rules.html).
- [Google Fonts — Knowledge](https://fonts.google.com/knowledge):
  artículos cortos por tema.

### Inspiración "esotérica / editorial"

- [Are.na — Occult design](https://www.are.na/search?q=occult+design):
  tablero colaborativo con referencias visuales curadas.
- [Van Schneider — The Dark Mode issue](https://vanschneider.com/blog/the-dark-mode-issue):
  sobre dark mode bien hecho.

---

## Resumen

> Tres fuentes (Cinzel + Cormorant Garamond + Inter), paleta noche +
> oro + pergamino, efectos hechos con **box-shadow, text-shadow,
> filter, backdrop-filter y pseudo-elementos**. Cero librerías de
> animación. Todo CSS nativo.
