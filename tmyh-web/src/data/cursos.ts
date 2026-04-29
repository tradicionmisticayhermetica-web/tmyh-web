/**
 * Catálogo de cursos de la escuela.
 *
 * Cada entrada genera automáticamente:
 *  - una tarjeta en /cursos (vía src/pages/cursos/index.astro)
 *  - una página de detalle en /cursos/<slug> (vía src/pages/cursos/[slug].astro)
 *
 * Para agregar un curso nuevo, alcanza con sumar un objeto a este array.
 *
 * Los cursos "activo" aparecen en la sección principal de /cursos.
 * Los "historico" se muestran al final como "Cursos dictados".
 * Los "proximo" aparecen en una sección "Próximamente".
 */

export interface Precio {
  /** Precio en pesos argentinos para pago en efectivo / MercadoPago / tarjeta. */
  argEfectivo?: string;
  /** Precio en pesos argentinos con descuento por transferencia bancaria. */
  argTransferencia?: string;
  /** Precio internacional en USD. */
  internacionalUSD?: string;
  /** Nota adicional (ej: "hasta 3 cuotas con tarjeta"). */
  nota?: string;
}

export interface DatosInscripcion {
  /** Email para confirmar pago y recibir el acceso. */
  email?: string;
  /** Número de WhatsApp (formato internacional sin +). */
  whatsapp?: string;
  /**
   * URL de pago de MercadoPago **específica de este curso**.
   *
   * Cada curso debe tener su propio link de pago generado desde el panel de
   * MP (Cobrar → Link de pago → Crear link). El link trae asociado el monto
   * exacto de ese curso y una descripción, así el comprador ve el precio
   * correcto al abrir MP.
   *
   * Si se omite, el botón "Pagar con MercadoPago" no se muestra.
   */
  linkMercadoPago?: string;
  /**
   * Usuario de PayPal.me (sin el "https://paypal.me/").
   *
   * El monto en USD se toma automáticamente de `precio.internacionalUSD`
   * para construir la URL final: `paypal.me/<user>/<monto>USD`. Así no hace
   * falta crear un link nuevo por curso, alcanza con indicar el usuario una
   * sola vez.
   */
  paypalUser?: string;
  /** CBU bancario para transferencia. */
  cbu?: string;
  /** Alias bancario. */
  alias?: string;
  /** Banco destino. */
  banco?: string;
  /** CUIT del titular. */
  cuit?: string;
}

export interface Curso {
  /** URL slug, ej. "simbologia-hermetica" → /cursos/simbologia-hermetica */
  slug: string;
  /** Título visible */
  titulo: string;
  /** Subtítulo opcional (ej: "Curso introductorio" debajo del título) */
  subtitulo?: string;
  /** Bajada corta para tarjetas (<= 140 chars) */
  descripcionCorta: string;
  /** Descripción larga (array de párrafos para la página de detalle) */
  descripcionLarga: string[];
  /** Cantidad de clases */
  clases: number;
  /** Modalidad */
  modalidad: "Online en vivo" | "Grabado" | "Híbrido";
  /** Nivel / perfil de alumno */
  nivel: string;
  /** Temas principales (listados en el detalle). Cada item puede ser un string simple o un objeto con título + subitems. */
  temas: Array<string | { titulo: string; items: string[] }>;
  /** Fecha de inicio, formato libre. Ej: "Jueves 14 de mayo de 2026, 15:00 hs (GMT-3)" */
  inicio?: string;
  /** Duración total (ej: "3 meses") */
  duracion?: string;
  /** Si está activo, es histórico o próximo */
  estado: "activo" | "proximo" | "historico";
  /** Emoji o símbolo hermético decorativo */
  simbolo: string;
  /** Precios (solo para cursos activos) */
  precio?: Precio;
  /** Datos de inscripción (solo para cursos activos) */
  inscripcion?: DatosInscripcion;
  /** Año original en que se dictó (usado para históricos) */
  anioOriginal?: string;
  /** Nombre del archivo de imagen en /src/assets/images/ (ej: "raphael-psyche.jpg"). Se resuelve dinámicamente con Astro Image. */
  imagen?: string;
  /** Texto alternativo descriptivo para la imagen (accesibilidad). */
  imagenAlt?: string;
  /** Nombre de archivo PDF en /public/assets/ descargable (ej: "programa-heka.pdf"). */
  programaPdf?: string;
}

/* ────────────────────────────────────────────────────────────────────────
   Datos de contacto/inscripción comunes (se repiten en Simbología y Heka)
   Los links de MercadoPago se definen por curso, porque cada link lleva
   asociado un monto distinto. PayPal se deriva del precio en USD.
   ──────────────────────────────────────────────────────────────────────── */
const inscripcionComun: DatosInscripcion = {
  email: "tradicionmisticayhermetica@gmail.com",
  whatsapp: "5491165008996",
  paypalUser: "masajesonoro",
  cbu: "0720044188000037705222",
  alias: "TRINEO.AMIGA.DECENA",
  banco: "Banco Santander Río (caja de ahorro en pesos)",
  cuit: "20-27565970/4",
};

export const cursos: Curso[] = [
  /* ════════════════════════════════════════════════════════════════════
     CURSOS ACTIVOS
     ════════════════════════════════════════════════════════════════════ */

  {
    slug: "simbologia-hermetica",
    titulo: "Curso Introductorio a la Simbología Hermética",
    subtitulo: "Edición 2026",
    descripcionCorta:
      "Doce sesiones en diferido para introducirse al pensamiento simbólico en su sentido trascendente. Iconografía clásica, filosófica y alquímica.",
    descripcionLarga: [
      "«Los símbolos sólo existen para recordar los misterios de la ciencia divina.» Hablando de símbolos, es necesario, en primer lugar, comprender de qué se trata. Para eso se precisa, como siempre, buscar el sentido etimológico de la palabra. Símbolo significa «signo de reconocimiento»; ese es el sentido exacto de la palabra griega symbolon, del verbo symballo, juntar, reunir; symbolé significa ajuste. — Raimon Arola",
      "Internamente somos como un rompecabezas cuyas piezas están separadas una de la otra. Sólo con la dedicación y el trabajo interior se logra, poco a poco, ir uniéndolas hasta alcanzar la unidad integral, siempre utilizando al símbolo (o a los símbolos) como interfase para la unión de todas las partes que conforman las dos realidades que ocupa el ser humano: por un lado, aquella inefable y lejana «otredad» que supone estar frente a una naturaleza exterior y desconocida; y otra, mucho más cercana, tan cercana e íntima que se vuelve igualmente inaprensible por nosotros mismos y desconocida de la misma manera.",
      "Este curso fue desarrollado para introducir al pensamiento simbólico en un sentido trascendente. Intentamos dar el puntapié inicial para comenzar el recorrido interior a través de la geografía sutil del máximo símbolo: nosotros mismos. A través de la iconografía clásica, filosófica y alquímica descubriremos las analogías con los procesos naturales que gobiernan el mundo visible e invisible, en su forma metafísica y también física.",
      "El programa (aunque sujeto a modificaciones) comienza con las formas básicas de los símbolos, que nos llevarán a comprender mejor el sentido vivo del símbolo alquímico. No se trata de verlo solo como un «signo» que refiere a una realidad profana ni a una convención humana, sino de recuperar el valor necesario dentro de un marco sagrado, artístico y creativo. Todo el material es descargable y el acceso es permanente.",
    ],
    clases: 12,
    modalidad: "Grabado",
    nivel: "Inicial — abierto a todos",
    duracion: "3 meses",
    inicio: "Material disponible en acceso permanente (edición en curso)",
    temas: [
      "Introducción al simbolismo en las distintas culturas. Nacimiento del arte. Diferencias entre lo sagrado y lo profano, signo y símbolo.",
      "Macrocosmos y Microcosmos. «Como es arriba, es abajo.»",
      "La unidad de la materia en la visión de los alquimistas. La Alquimia operativa de grado.",
      "Simbología y magia natural. La vibración universal.",
      "El simbolismo de los elementos y su función dentro del marco cosmogónico tradicional.",
      "Las distintas dimensiones que nos componen en lo oculto. Organización de los diferentes sistemas simbólicos.",
      "El Templo del ser humano. Anatomía oculta.",
      "La experiencia visionaria que da acceso a la vida del símbolo: el viaje chamánico o mediúmnico.",
      "La Iniciación y los ritos de las órdenes herméticas.",
      "Los emblemas rosacruces y masónicos.",
      "Geometría del símbolo: figuras simples y construcción del lenguaje simbólico.",
      "El Andrógino alquímico.",
    ],
    estado: "activo",
    simbolo: "☿",
    precio: {
      argEfectivo: "$210.000",
      argTransferencia: "$189.000",
      internacionalUSD: "179 USD",
      nota: "Hasta 3 cuotas con tarjeta de crédito · 10% OFF por transferencia bancaria",
    },
    // TODO (Emanuel): generar un nuevo link de pago en MercadoPago específico
    // para Simbología con $210.000 y pegarlo acá como `linkMercadoPago: "..."`.
    // Hasta que el link exista, el botón "Pagar con MercadoPago" NO aparece y
    // se muestra solo la opción de pago por transferencia/WhatsApp/email.
    inscripcion: {
      ...inscripcionComun,
    },
    imagen: "afiche-simbologia-hermetica.png",
    imagenAlt:
      "Afiche del Curso de Simbología Hermética — Tradición Mística y Hermética. Simbología e introducción al pensamiento hermético tradicional.",
  },

  {
    slug: "heka",
    titulo: "Heka — Teoría y Praxis de la Magia en el Egipto Faraónico",
    subtitulo: "Nuevo curso · Inicio mayo 2026",
    descripcionCorta:
      "Un viaje por la «física de lo sagrado» del Antiguo Egipto. Seis módulos sobre el Heka como fuerza natural, el poder del verbo, el ritual y la magia de la imagen.",
    descripcionLarga: [
      "«Yo soy Heka, el señor de los Ka's, aquel que une las almas.» — Textos de los Sarcófagos",
      "Les presento aquí un curso que estaré dando en breve. Los que me conocen saben que he dedicado mucho tiempo al estudio e investigación del Antiguo Egipto religioso y místico. Ese conocimiento, junto con el hermetismo clásico, se funde en este nuevo curso. Si les fascina el Antiguo Egipto más allá de sus mitos, este curso es para ustedes.",
      "Los invito a un viaje por su esencia más profunda, para descubrir la «física de lo sagrado». Para los egipcios, la magia no era un truco: era una fuerza natural y palpable (tan real como el Nilo) llamada Heka. Heka significa «encender el Ka», despertar la energía vital de todo lo que nos rodea. En su cosmovisión era un dios primordial que dio forma al orden cósmico (Maat) a partir del caos.",
      "No estudiaremos supersticiones. Vamos a recorrer una praxis sofisticada, diseñada para que la voluntad humana influya directamente en la realidad. En esta civilización no existían fronteras entre religión, naturaleza y magia: todo formaba un entramado donde un médico sanaba tanto con remedios como con oraciones. Analizaremos cómo esta fuerza permeaba desde los rituales sacerdotales hasta la protección del hogar, cobrando vida mediante la intención, la voz y el gesto ritual.",
      "Recorreremos desde el origen del universo hasta el uso del Heka como escudo frente al caos. Aunque los conceptos sean profundos, los asimilaremos con total claridad. Al finalizar el curso, habrán desvelado el verdadero significado de esta fuerza y su visión del mundo egipcio cambiará radicalmente.",
    ],
    clases: 12,
    modalidad: "Grabado",
    nivel: "Inicial / Intermedio — abierto a quien le interese el Antiguo Egipto",
    duracion: "3 meses",
    inicio: "Jueves 14 de mayo de 2026, 15:00 hs (GMT-3)",
    temas: [
      {
        titulo: "Módulo 1 — Naturaleza y concepto del Heka",
        items: [
          "Definiciones de magia: la visión moderna frente a la mentalidad egipcia antigua.",
          "Magia y religión: la magia como puesta en práctica de la religión para intervenir en el devenir.",
          "Heka como fuerza natural: no como algo sobrenatural, sino inherente a la creación.",
          "Dualidad del poder: uso protector (apotropaico) frente al destructivo (Heka Dju).",
        ],
      },
      {
        titulo: "Módulo 2 — Ontología de la creación y poder del verbo",
        items: [
          "El origen en el Nun: del «no ser» potencial al «ser» manifestado a través de la magia.",
          "La palabra y la escritura: recitar, pronunciar y escribir para manifestar la realidad.",
          "Magia ciclo-regenerativa: el Heka en el viaje nocturno del sol y el mantenimiento del orden.",
          "Componentes del ser: la magia en relación al espíritu (Ba), la fuerza vital (Ka) y el poderío (Pejti).",
        ],
      },
      {
        titulo: "Módulo 3 — Dinámica del ritual y fluidos creadores",
        items: [
          "Estructura del acto mágico: interconexión entre ritual, encantamiento y artefactos.",
          "La saliva como fluido de manifestación: creación de Shu y Tefnut.",
          "Propiedades medicinales: uso de la saliva en remedios y regeneración.",
          "Soplar y el aliento de vida: Chau Ankh y el ritual de la apertura de la boca.",
        ],
      },
      {
        titulo: "Módulo 4 — Transferencia de poder e ingestión de la magia",
        items: [
          "Paralelismo saliva-semen: nexo creativo entre fluidos y procreación divina.",
          "Chupar y lamer (Nesep): la lengua para absorber y transferir poder (vínculo con Hathor e Isis).",
          "Tragar la magia: ingestión física de la fuerza para llenar el cuerpo de poder y transformación.",
          "La mano y la vulva: simbolismo de la procreación solitaria del dios creador.",
        ],
      },
      {
        titulo: "Módulo 5 — Magia de la imagen y execración",
        items: [
          "Iconografía del control: el enemigo subyugado como medio para repeler el caos.",
          "Función apotropaica: representaciones protectoras en templos y bastones reales.",
          "Rituales de execración: la ruptura intencionada de vasijas para aniquilar enemigos.",
          "Análisis arqueológico: el depósito de Mirgissa y las estatuillas de prisioneros.",
        ],
      },
      {
        titulo: "Módulo 6 — Especialistas, sueños y literatura mágica",
        items: [
          "La Casa de la Vida (Per Ankh): institución donde se elaboraban y conservaban los textos mágicos.",
          "Jerarquías mágicas: el rol del Sacerdote Lector y el Sacerdote Heka como guardianes.",
          "El mundo onírico: comunicación con los difuntos, interpretación de sueños y premoniciones.",
          "Magia en los relatos: la figura del mago en la literatura y el conocimiento divino.",
        ],
      },
    ],
    estado: "activo",
    simbolo: "𓋹",
    precio: {
      argEfectivo: "$235.000",
      argTransferencia: "$199.000",
      internacionalUSD: "179 USD",
      nota: "Hasta 3 cuotas con tarjeta · 10% OFF por transferencia bancaria",
    },
    // Link MP ya existente con $235.000 cargado para Heka. Confirmado por Juan
    // el 2026-04-20.
    inscripcion: {
      ...inscripcionComun,
      linkMercadoPago: "https://mpago.li/2tFSsrd",
    },
    imagen: "heka.png",
    imagenAlt:
      "Afiche de Heka — Teoría y Praxis de la Magia en el Egipto Faraónico, Centro de Estudios TM&H.",
    programaPdf: "programa-heka.pdf",
  },

  /* ════════════════════════════════════════════════════════════════════
     CURSOS DICTADOS (históricos)
     Quedan visibles como archivo de los programas que ya se dieron.
     ════════════════════════════════════════════════════════════════════ */

  {
    slug: "espagiria",
    titulo: "Curso de Espagiria",
    descripcionCorta:
      "El arte alquímico de separar, purificar y reunir. La Espagiria como práctica vegetal y disciplina interior.",
    descripcionLarga: [
      "La Espagiria es la aplicación del principio alquímico «solve et coagula» al reino vegetal. En este curso de tres grados (Inicial, Segundo y Tercero) se aprende tanto la técnica de laboratorio como el trabajo interno que ésta refleja. Cada planta es un maestro, y su obra en el atanor es un espejo de la obra en nosotros mismos.",
    ],
    clases: 12,
    modalidad: "Grabado",
    nivel: "Tres grados: Inicial, 2° grado y 3er grado",
    temas: [
      "Primeros principios: azufre, mercurio y sal",
      "La destilación y la extracción de esencias",
      "Trabajo con plantas planetarias",
      "La calcinación y el renacer",
      "El atanor interior",
      "Sales espagíricas y elixires",
      "Medicina paracelsiana",
      "Correspondencias herméticas",
    ],
    estado: "historico",
    simbolo: "🜔",
    anioOriginal: "2022",
    imagen: "afiche-espagiria.png",
    imagenAlt:
      "Afiche del Curso de Espagiria — Herbolaria astrológica para la confección de elixires naturales. Artes herméticas aplicadas en laboratorio.",
  },

  {
    slug: "el-cuerpo-solar",
    titulo: "El Cuerpo Solar",
    descripcionCorta:
      "La construcción del cuerpo de luz: doce clases sobre el despertar del Sol Interior.",
    descripcionLarga: [
      "El Cuerpo Solar es el vehículo espiritual que el iniciado construye a lo largo de su trabajo interior. Este curso es una exposición sistemática del camino hermético hacia el nacimiento del Sol Interior, con raíces en la tradición cristiana esotérica, la alquimia y los misterios antiguos.",
    ],
    clases: 12,
    modalidad: "Grabado",
    nivel: "Intermedio — útil haber tomado Simbología",
    temas: [
      "El germen solar en el hombre",
      "Las fases de la gran obra",
      "La respiración y los centros sutiles",
      "Los ejercicios del Rayo",
      "El Sol del corazón",
      "La transfiguración",
    ],
    estado: "historico",
    simbolo: "☉",
    imagen: "afiche-cuerpo-solar.png",
    imagenAlt:
      "Afiche de El Cuerpo Solar — Física y metafísica del cuerpo glorificado. Tradición Mística y Hermética.",
  },

  {
    slug: "revelaciones",
    titulo: "Revelaciones",
    descripcionCorta:
      "Lectura hermética del Apocalipsis de Juan. El símbolo como ciencia del fin y del principio.",
    descripcionLarga: [
      "Una interpretación simbólica y hermética del texto de Juan: las siete iglesias, los siete sellos, la bestia, la nueva Jerusalén. Lo leemos como un mapa iniciático del alma en su recorrido por la transformación final, lejos de la lectura literal o apocalíptica que suele escucharse.",
    ],
    clases: 12,
    modalidad: "Online en vivo",
    nivel: "Avanzado",
    temas: [
      "Las siete iglesias y los siete centros",
      "Los cuatro vivientes y las fuerzas elementales",
      "Los jinetes del Apocalipsis",
      "El dragón y la mujer vestida de sol",
      "La caída de Babilonia",
      "La nueva Jerusalén y las bodas místicas",
    ],
    estado: "historico",
    simbolo: "👁",
    imagen: "afiche-revelaciones.png",
    imagenAlt:
      "Afiche de Revelaciones — Los mensajes ocultos en las profecías sobre el final de los tiempos. Centro de Estudios Tradicionales TM&H.",
  },

  {
    slug: "tradicion-hermetica",
    titulo: "Tradición Hermética",
    descripcionCorta:
      "El corpus de Hermes: de la Tabla Esmeralda a la filosofía oculta del Renacimiento.",
    descripcionLarga: [
      "Un recorrido por la Tradición Hermética en su fuente: el Corpus Hermeticum, la Tabla Esmeralda, los textos de Trismegisto y sus ecos en Ficino, Pico della Mirandola, Agrippa y el esoterismo moderno. Es una introducción panorámica para quien quiera ubicar el resto de la escuela en su linaje.",
    ],
    clases: 12,
    modalidad: "Grabado",
    nivel: "Inicial",
    temas: [
      "El mito de Hermes Trismegisto",
      "Los textos del Corpus Hermeticum",
      "La Tabla Esmeralda y sus 13 sentencias",
      "Hermetismo en el mundo árabe y medieval",
      "El Renacimiento neoplatónico y hermético",
      "Ecos modernos: masonería, Martinismo, Rosacruz",
    ],
    estado: "historico",
    simbolo: "⚯",
  },
];

/** Obtener un curso por slug de forma tipada. */
export function getCurso(slug: string): Curso | undefined {
  return cursos.find((c) => c.slug === slug);
}

/** Type guard para saber si un tema tiene subitems. */
export function esTemaConSubitems(
  tema: string | { titulo: string; items: string[] }
): tema is { titulo: string; items: string[] } {
  return typeof tema === "object" && "items" in tema;
}
