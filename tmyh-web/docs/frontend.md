# Guía básica del frontend — TM&H

Este documento describe, en lenguaje simple, cómo está armado el sitio nuevo
de Tradición Mística y Hermética. Está pensado para cualquier persona
(aunque no sea programadora) que quiera entender qué decisiones hay detrás
de cómo se ve y se comporta el sitio.

No es un manual técnico exhaustivo ni un diagrama de arquitectura: es el
detalle "estético y de sensaciones".

---

## 1. La idea general

Queríamos un sitio que se sintiera **esotérico, serio y moderno al mismo
tiempo**. La referencia no es "web mística con estrellitas animadas", sino
más bien un libro bien editado: tipografía cuidada, mucho espacio en
blanco (o más bien, en negro), dorados sobrios y nada que distraiga de lo
que se lee.

Tres palabras que guían todas las decisiones:

- **Templo**: proporciones verticales, ornamentos, simetría cuando suma.
- **Pergamino**: texto largo tratado con respeto, tipografías de libro.
- **Noche**: fondo oscuro, dorado como luz tenue, no brillos agresivos.

---

## 2. Paleta de colores

### Fondos (la "noche")

- Negro muy profundo con matiz violáceo (`#07060d` y `#0b0a12`). No es negro
  puro; tiene temperatura.
- La página entera tiene un halo dorado tenue arriba y un halo granate
  abajo, muy sutiles. Crean atmósfera sin verse.

### Acentos (el "oro antiguo")

- Cinco tonos de dorado que van del más claro (`#e6c464`) al más oscuro
  (`#7a6128`).
- El dorado se usa para: títulos secundarios pequeños, botones, bordes al
  hacer hover, símbolos herméticos, ornamentos divisores.

### Texto (el "pergamino")

- Cinco tonos que van del crema claro (`#f5ecd7`) al beige apagado
  (`#8b7e5d`).
- El texto principal usa el tono 100. Los textos secundarios usan 200, 300
  o 400 según cuánto quieran "retroceder" visualmente.

### Granate

- Tres tonos (`#6e1e30` y alrededores) reservados para acentos de fondo
  muy puntuales. Por ahora casi no se usan; quedan disponibles.

### Selección de texto

- Cuando seleccionás un párrafo con el mouse, el fondo seleccionado se
  vuelve **dorado** y el texto negro. Detalle chico pero distintivo.

---

## 3. Tipografías

Se usan **tres familias**, todas cargadas desde Google Fonts.

### Cinzel — para títulos

- Serif estilo grabado romano, inspirada en inscripciones antiguas.
- Evoca piedra, templo, solemnidad.
- Se usa en H1, H2, H3, H4, precios grandes y el nombre de la escuela en
  el header.

### Cormorant Garamond — para cuerpo largo

- Serif literaria, elegante, pensada para lectura larga.
- Tiene cursiva disponible, que usamos en subtítulos y epígrafes.
- Se usa en: bajadas de cursos, bio de Emanuel, cita de Guénon, párrafos
  del blog, descripciones largas.

### Inter — para UI y microtexto

- Sans-serif moderna, muy legible en pantallas chicas.
- Se usa en: navbar, footer, botones, labels, CBU/alias/email, fechas,
  todo lo "funcional".

### Fallbacks

Cada fuente tiene un plan B (Georgia, Times New Roman, fuente del
sistema) por si Google Fonts tarda o está caído. El sitio sigue viéndose
bien incluso sin internet.

---

## 4. Elementos visuales recurrentes

Estos componentes aparecen repetidos en todo el sitio y son los que le
dan cohesión:

### Título secundario con línea (`title-eyebrow`)

Una palabra o dos en mayúsculas, pequeñas, dorada, con una línea dorada
fina debajo. Funciona como "sello" sobre cada título grande.

Ejemplo: "Nuestros programas", "Reflexiones", "Inscripción abierta".

### Ornamento divisor

Dos líneas horizontales dorado-tenues con un símbolo hermético en el
medio (✦, ☉, ✧). Separa secciones sin necesidad de un título.

### Tarjeta "altar" (`card-altar`)

Fondo degradado oscuro, borde dorado muy sutil, bordes redondeados
apenas. Es el contenedor base de los cursos, los posts del blog, los
bloques de inscripción. Al pasar el mouse se levanta, el borde se vuelve
más dorado y aparece un "glow" ambarino alrededor.

### Botón dorado (`btn-gold`)

Botón sólido dorado con degradado suave y sombra ambarina. Es la llamada
principal a la acción (inscribirse, escribir, ver cursos).

### Fondo estrellado (`stars-bg`)

Las páginas con hero grande (home, cada curso) tienen un fondo de puntos
tenues simulando estrellas lejanas. Son **quietas**, no titilan. Pintadas
con CSS puro, no son imagen.

### Imágenes "altar" (`img-altar`)

Las imágenes curadas del archivo (Mnemósine, Guénon, Hermes, Raphael,
Fludd, Memento Mori, afiches) pasan por un tratamiento uniforme para que
convivan bien con la paleta noche/dorado:

- **Filtro**: un leve desaturado y tono cálido (la imagen pierde un
  poco de color y gana tinte sepia muy suave). Esto unifica fotos
  modernas con grabados antiguos.
- **Marco**: borde dorado de 1 píxel muy tenue.
- **Sombra**: un halo dorado tenue + sombra negra profunda debajo.
  Parece que la imagen "flota" sobre el fondo oscuro.
- **Al pasar el mouse**: el filtro se levanta un poco (la imagen
  recupera su color original), el borde dorado se vuelve más visible y
  el halo aumenta.

Hay tres variantes:

- `img-altar`: la base, para imágenes rectangulares.
- `img-altar-round`: para retratos, aplica máscara circular.
- `img-altar-atmosphere`: versión muy atenuada y con transparencia, se
  usa como fondo decorativo (Fludd en la home va así).

Además existe un contenedor `img-veil` con degradados negro arriba y
abajo, para que la imagen se funda con el fondo en los heros.

---

## 5. Animaciones

Son **pocas y muy sobrias**. La idea es que nadie las note
conscientemente; se tienen que sentir, no ver.

### Transiciones al pasar el mouse (hover)

- **Enlaces**: cambian a dorado con el subrayado dorado.
- **Botón dorado**: sube 1 píxel y el brillo dorado aumenta.
- **Tarjetas de cursos y blog**: suben 4 píxeles, el borde se vuelve
  dorado y aparece un halo ambarino.
- **Símbolo hermético en las tarjetas**: arranca tenue y se ilumina al
  hover.

Todas estas transiciones duran entre 180 y 240 milisegundos. Son
**rápidas y casi imperceptibles**.

### Scroll suave

Cuando hacés click en "Cómo inscribirse" desde la ficha de un curso, el
scroll baja con una animación suave en vez de saltar de golpe.

### Menú mobile

Al tocar el ícono hamburguesa en celular, el menú aparece directamente
(sin animación de slide). Es simple y deliberadamente austero.

### Pulsado lento (disponible, aún sin usar)

Hay una animación definida (`soft-pulse`) que hace parpadear muy lento
(cada 4 segundos) un elemento. Está lista para cuando queramos marcar
algo como "activo" o llamar la atención sutilmente. Todavía no se aplica
en ninguna parte.

### Smooth scroll + reveal (Home, `/tradicion`, `/cursos`, `/blog`, `/contacto`)

A partir de mayo 2026, las cinco páginas públicas del sitio —Home,
`/tradicion`, `/cursos`, `/blog` y `/contacto`— comparten un efecto
coordinado de scroll. Es la diferencia visual entre "estás navegando un
sitio cualquiera" y "estás entrando a un templo". Las páginas
utilitarias (login, recuperar password, área reservada) siguen con
scroll nativo, plano y sobrio.

El efecto vive en `src/components/SmoothScrollReveal.astro` y se monta
únicamente vía el slot `background-effects` del `BaseLayout`. Tiene
tres capas:

1. **Smooth scroll con inertia** (librería [Lenis](https://github.com/darkroomengineering/lenis),
   ~3 KB). Suaviza el scroll de rueda y trackpad con un decay natural.
   En táctil deja el scroll nativo del sistema para no entorpecer el
   gesto del celular. Sin esto el scroll se siente "duro" y mecánico.

2. **Fondo decorativo en dos capas, fijo respecto al viewport**:
   - Un **cielo estrellado profundo** (varias capas de `radial-gradient`
     en CSS, sin imágenes) con dos animaciones combinadas:
     un *drift* muy lento de toda la grilla cada 4 minutos y un
     *twinkle* (parpadeo) en algunas estrellas doradas cada 5 segundos.
     Suma sensación de "cielo vivo" sin que se note conscientemente.
   - Un **caduceo de Mercurio 3D dorado** (PNG con canal alfa real,
     recortado con `scripts/recortar_caduceo.py`), gigante y centrado,
     con opacidad ~12 % y blur ~4 px. Gira sobre su **eje vertical**
     (`rotateY`, no `rotate`) usando `perspective(1400px)` para que se
     vea con profundidad real, como una moneda girando. Decisión
     simbólica importante: usar `rotateY` y `backface-visibility:
     hidden` evita que el caduceo aparezca jamás invertido durante el
     giro — la inversión del símbolo tiene un significado contrario a
     la tradición hermética que enseña el sitio. La rotación está
     atada al **progreso** del scroll: en cualquier página da
     exactamente un giro completo (0° → 360°) y termina 35 % más cerca
     (scale 1 → 1.35).

3. **Reveal de bloques con [AOS](https://michalsnik.github.io/aos/)**
   (Animate On Scroll, ~5 KB). Cada bloque se marca con
   `data-aos="fade-up"` (o variantes: `fade-right`, `zoom-in-up`,
   `flip-up`, etc.) y AOS dispara la animación al entrar al viewport.
   Tres parámetros adicionales que usamos:
   - `data-aos-duration="900"` — duración de la animación, en ms.
   - `data-aos-delay="200"` — retardo antes de animar (útil para
     bloques secundarios como las redes sociales).
   - `data-aos-anchor-placement="center-bottom"` — define en qué punto
     del scroll se dispara: `top-bottom` (cuando el top del elemento
     toca el borde inferior del viewport), `center-bottom` (cuando el
     centro lo toca, más sutil), `bottom-bottom`, etc.

La regla de aplicación:

- **Sí** lo usan: Home (`/`), `/tradicion`, `/cursos`, `/blog` y
  `/contacto`. Todas las páginas públicas del menú principal.
- **No** lo usan: área reservada (`/area-reservada/*`), login,
  recuperar password, restablecer password, páginas individuales de
  curso (`/cursos/[slug]`), página individual de post
  (`/blog/post`), 404, ni las páginas de gestión del newsletter
  (`unsubscribe`, `preferencias`). Esas son utilitarias o de lectura
  larga, y el smooth scroll molestaría a quien está leyendo un curso
  o un post completo.

### Scrollbar nativa oculta (todo el sitio)

Por decisión estética (mayo 2026), la scrollbar nativa del navegador
está **oculta en todas las páginas del sitio**. La regla vive en
`src/styles/global.css` (afecta `html` y `body`). El scroll sigue
funcionando normalmente con rueda, trackpad, teclado (Page Up/Down) y
touch: lo único que cambia es que no se ve la barra fea de Windows o
macOS pintada al costado. Esto incluye el backoffice; si en algún
momento esa decisión molesta en alguna pantalla de admin, se puede
revertir devolviendo `scrollbar-width: auto` localmente al body de
esa ruta.

Cuando un contenedor interno necesita tener scroll propio (caso
único hoy: la lista del blog), define su propia scrollbar con
`scrollbar-width: thin` + `::-webkit-scrollbar` a medida. En el blog
es fina, 6 px de ancho, dorada translúcida.

### Buscador y scroll interno del blog

En `/blog`, además del efecto general, hay dos extras propios:

- **Buscador client-side**: input arriba de la lista que filtra los
  posts por título, extracto y etiquetas, normalizando tildes y
  mayúsculas (`espagiria` matchea `Espagiría`). Aparece solo si hay
  3+ posts; con menos no aporta y ensucia visualmente. Si filtra y no
  hay matches, muestra el cartel "No encontramos reflexiones que
  coincidan con la búsqueda".
- **Scroll interno**: la lista vive dentro de un wrapper con
  `max-height: min(75vh, 800px)` y `overflow-y: auto`, con la
  scrollbar fina dorada descrita arriba. Tiene el atributo
  `data-lenis-prevent` para que Lenis **no** intercepte la rueda del
  mouse cuando el cursor está sobre la lista: así el scroll de rueda
  scrollea la lista interna, no el body. Esto es crítico, sin ese
  atributo el scroll interno sería inútil porque Lenis se comería
  los eventos.

### Accesibilidad: respeta `prefers-reduced-motion`

Si el usuario tiene activada la preferencia del sistema "reducir
movimiento", el componente desactiva todo: Lenis se apaga (vuelve al
scroll nativo), el caduceo se oculta, las estrellas se congelan y AOS
no anima nada (los bloques aparecen instantáneos). Obligatorio por
WCAG 2.1 y se maneja con un solo `@media` query + `AOS.init({ disable })`.

### Lo que NO se usa (a propósito)

- No hay loaders ni splash screens.
- No hay cursor personalizado.
- No hay parallax pesado, "scroll-jacking" duro, ni elementos
  pinneados que paren el scroll.
- No hay librerías de animación grandes (Framer Motion, GSAP): solo
  Lenis (~3 KB) y AOS (~5 KB).
- No hay caduceo girando ni cielo estrellado animado en el backoffice
  ni en páginas individuales de curso/post.

La regla fue: "si no aporta a la sensación de templo, no va". Por eso
el efecto se aplica a las cinco páginas del menú público y se omite
en utilitarias / lectura larga.

---

## 6. Experiencia de lectura

### Ancho máximo de texto

El contenido está contenido dentro de un ancho máximo (`container-prose`)
de aproximadamente 72rem (~1152px). Nunca llega al borde de la pantalla
en monitores grandes. Esto hace que los párrafos tengan un ancho
cómodo de lectura, como en un libro.

### Espaciado

Las secciones están separadas por mucho aire (padding vertical de 64 o
80 píxeles). Nada se siente apretado. Esto también contribuye a la
sensación de "templo": espacio para respirar.

### Contraste

El texto principal es crema claro sobre fondo casi negro. Cumple con los
estándares de accesibilidad (WCAG AA) para lectura.

### Balance de títulos

Los títulos usan `text-wrap: balance`, una técnica moderna que evita que
quede "una palabra sola en la última línea". Hace que los títulos se
vean siempre bien cortados.

---

## 7. Mobile y responsive

El sitio está pensado **mobile first** pero se ve bien en cualquier
tamaño:

- **Celular (<768px)**: menú hamburguesa, columnas apiladas, tipografías
  un poco más chicas en los títulos.
- **Tablet (768-1024px)**: dos columnas cuando tiene sentido (ficha de
  curso con aside de inscripción).
- **Desktop (>1024px)**: tres columnas en la grilla de cursos, aside
  "sticky" que acompaña el scroll en las fichas de curso.

No hay puntos de quiebre raros. Funciona igual en todos los tamaños, solo
cambia la densidad.

---

## 8. Accesibilidad básica

Decisiones tomadas para que el sitio lo pueda usar cualquiera:

- **Contraste de color** que cumple WCAG AA.
- **Foco visible**: cuando alguien navega con teclado (tab), aparece un
  borde dorado alrededor del elemento activo.
- **Alt text en imágenes**: cada imagen descriptiva tiene un texto
  alternativo (importante para lectores de pantalla y para cuando una
  imagen no carga).
- **Atributos ARIA** en el menú mobile para que los lectores de pantalla
  anuncien correctamente si está abierto o cerrado.
- **Idioma declarado** (`lang="es"`) para que los traductores automáticos
  y lectores de pantalla usen pronunciación correcta.
- **Links reales, no botones disfrazados**: navegar con teclado funciona
  naturalmente.

---

## 9. SEO básico

Cada página tiene:

- Un título único (aparece en la pestaña del navegador y en los
  resultados de Google).
- Una meta-description única (el resumen que aparece bajo el título en
  Google).
- URL canónica (evita problemas de contenido duplicado).
- Metadatos para compartir en redes (Open Graph): cuando alguien pegue
  un link de un curso en WhatsApp, aparece el título, descripción y
  (eventualmente) una imagen.
- Estructura semántica: `<header>`, `<main>`, `<article>`, `<footer>`.

Esto se completará con mapas de sitio (`sitemap.xml`) y datos
estructurados (schema.org) cuando el sitio esté en producción.

---

## 10. Cómo se manejan las imágenes

Todas las imágenes del sitio viven en `src/assets/images/` con nombres
limpios (`mnemosine.jpg`, `fludd.jpg`, `hermes.jpg`, etc.).

**Astro las optimiza automáticamente** en tiempo de compilación:

- Convierte cada imagen a formato **WebP** (más liviano que JPG/PNG).
- Genera **3 tamaños por imagen** (480, 800, 1200 píxeles de ancho),
  y el navegador elige el más apropiado según el dispositivo.
- Un Fludd original de 1,5 MB se sirve como WebP de 129 KB en celular
  y 596 KB en desktop grande, sin pérdida visual apreciable.
- Cada imagen tiene `alt` descriptivo para accesibilidad.

El archivo `src/lib/images.ts` tiene una función (`resolverImagen`) que
permite que los cursos y posts guarden solo el nombre del archivo como
string y la página lo resuelva dinámicamente.

Para sumar una imagen nueva:

1. Copiarla a `src/assets/images/`.
2. En `src/data/cursos.ts` o `src/data/posts.ts`, poner el nombre del
   archivo en el campo `imagen` y un texto descriptivo en `imagenAlt`.
3. Listo. Astro la optimiza sola.

---

## 11. Qué falta (por sumar en próximas etapas)

- **Foto de Emanuel**: el código de `/sobre-mi` ya tiene el hueco
  preparado (`emanuelImg`). Apenas llegue la foto, se copia a
  `src/assets/images/emanuel.jpg` y se descomenta una línea; el layout
  redondo con filtro "altar" se renderiza solo.
- **Video de YouTube**: no se encontró ninguna URL específica en el
  contenido del sitio viejo. Queda pendiente pedirle a Emanuel uno o
  dos links si quiere sumarlos a la home o a algún curso.
- **OG image** personalizada para compartir en redes (hoy muestra texto
  solo). Se podría armar una con el símbolo hermético y el logo.
- **Favicon** más elaborado (hoy es uno simple de placeholder).
- **Panel de admin** para que Emanuel edite precios, fechas y blog sin
  depender de nadie (esto es una fase más grande, aparte).

---

## Resumen en una línea

> Paleta noche + dorado, tipografías Cinzel y Cormorant Garamond,
> animaciones mínimas, mucho aire, y todo pensado para que el texto y los
> símbolos sean los protagonistas.
