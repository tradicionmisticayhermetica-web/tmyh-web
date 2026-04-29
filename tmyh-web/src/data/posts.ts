/**
 * Reflexiones del blog.
 *
 * Cada entrada genera automáticamente:
 *  - una tarjeta en /blog (vía src/pages/blog/index.astro)
 *  - una página de detalle en /blog/<slug> (vía src/pages/blog/[slug].astro)
 *
 * Los posts se ordenan por `fechaISO` descendente (más reciente primero).
 *
 * Para agregar un post nuevo, alcanza con sumar un objeto a este array.
 */

export interface Post {
  /** URL slug, ej. "memento-mori" → /blog/memento-mori */
  slug: string;
  /** Título visible */
  titulo: string;
  /** Fecha en formato ISO (YYYY-MM-DD) para ordenar */
  fechaISO: string;
  /** Fecha en formato largo para mostrar */
  fechaLegible: string;
  /** Categoría / sección del post */
  categoria: "Hermetismo" | "Miscelaneas" | "Cursos";
  /** Resumen corto (<= 180 chars) para tarjetas */
  resumen: string;
  /** Autor */
  autor: string;
  /** Símbolo decorativo */
  simbolo: string;
  /** Contenido del post en párrafos (uno por elemento del array) */
  parrafos: string[];
  /** Nombre del archivo de imagen en /src/assets/images/ (ej: "memento-mori.webp"). Opcional. */
  imagen?: string;
  /** Texto alternativo de la imagen (accesibilidad). */
  imagenAlt?: string;
}

export const posts: Post[] = [
  {
    slug: "memento-mori",
    titulo: "Memento Mori",
    fechaISO: "2025-07-24",
    fechaLegible: "24 de julio de 2025",
    categoria: "Hermetismo",
    autor: "Emanuel Mari",
    simbolo: "☿",
    resumen:
      "Recuerda que morirás. Una reflexión sobre la putrefacción alquímica, la vanitas de la existencia y la reconstrucción del templo del Ser Humano.",
    parrafos: [
      "Memento Mori es una frase latina que significa «Recuerda que morirás» o «Recuerda morir», en el sentido de que debemos recordar nuestra mortalidad como seres humanos. Era una peculiar costumbre de la Antigua Roma que cuando un general desfilaba victorioso por las calles de Roma, un siervo se encargaba de advertirlo al grito: «Respice post te! Hominem te esse memento!» — «¡Mira tras de ti! Recuerda que eres un hombre» (y no un dios).",
      "Esta imagen ineludiblemente nos refiere a la etapa de la putrefacción alquímica, para así persuadirnos de la vanitas de la existencia y lo perecedero de los cuerpos. La naturaleza se descompone, mas el alma es inmortal. El espíritu habita brevemente en cada cuerpo y debemos aprovechar cada instante del tiempo que se nos ha concedido para hacer de esta experiencia algo trascendente.",
      "Nicolas Barnaud, en su obra Theatrum Quimicum, dice: «Se trata aquí de una tumba que no encierra cadáver; es un cadáver que no está encerrado en un sepulcro, porque el cadáver y el sepulcro no hacen más que uno…». Así este autor nos hace entender que solo existe una materia que nos compone, y amalgamada en ella los siete cuerpos pasionales que deben disolverse y junto con ellos los siete errores entenebrecedores del alma, más conocidos como «pecados capitales», los cuales se oponen a las siete virtudes del alma (cuatro cardinales y tres teologales).",
      "Es fundamental entender en qué consiste esta muerte que debe darse antes de la muerte, para así resurgir de entre los escombros del falso «yo» cual Ave Fénix. El proceso de iluminación requiere un arduo trabajo de demolición (disolución) que se lleva a cabo en nuestra precaria cabaña adámica, produciendo el derrumbe de sus frágiles muros y su podrida techumbre.",
      "Una vez concretada esa tarea, comienza la reconstrucción del templo del Ser Humano: con bases sólidas que garanticen la elevación hacia lo divino, grandes y perfumadas estancias para dar cobijo a las virtudes y profundos calabozos para condenar a los siniestros vicios. Nada tiene que ver con ser mejor o más feliz, sino con la completa erradicación de la falsedad que se monta sobre el delirante andamiaje de la pretensión.",
    ],
    imagen: "memento-mori.webp",
    imagenAlt:
      "Memento Mori: iconografía clásica que recuerda la finitud del cuerpo y la inmortalidad del alma.",
  },

  {
    slug: "sobre-la-iniciacion",
    titulo: "Sobre la iniciación",
    fechaISO: "2022-10-25",
    fechaLegible: "25 de octubre de 2022",
    categoria: "Hermetismo",
    autor: "Emanuel Mari",
    simbolo: "✦",
    resumen:
      "«Initium» significa «entrada» o «comienzo». Sobre la iniciación como influencia espiritual que debe ser comunicada, y la diferencia entre el hecho y su trabajo ulterior.",
    parrafos: [
      "Un tema recurrente dentro de la espiritualidad tiene que ver con el fenómeno que ha sido llamado «iniciación».",
      "Iniciación, «initium» como lo indica su etimología, significa «entrada» o «comienzo». R. Guénon nos comentaba al respecto: «Algunos confunden el hecho mismo de la iniciación, entendida en su sentido estrictamente etimológico, con el trabajo que hay que llevar a cabo ulteriormente para que esa iniciación devenga en efectiva.»",
      "Una iniciación es una influencia espiritual que debe ser comunicada por proximidad con un sabio, un santo iniciado, o incluso por alguna reliquia u objeto que le haya pertenecido.",
      "Esta transmisión siempre debe darse por contacto: con las manos, los pies o el soplo directo sobre la cabeza. Ocasionalmente también puede darse que haya una intervención directa de la divinidad sobre el que sea capaz de recibirla. No obstante, el obstáculo mayor que interfiere en la recepción de esta influencia es, ni más ni menos, el intelecto razonador.",
      "Es así que muchos son los iniciados pero pocos los que efectivamente han sido inflamados del espíritu, siendo capaces de transferir las influencias magnéticas necesarias que despierten bien la visión profética, bien los poderes ocultos residentes en el género humano.",
      "Si alguien dotado ha logrado ser debidamente iniciado, es capaz de despertar el espíritu aletargado en otros. Pero como bien dijo un sabio, el espíritu se ha reservado el privilegio de soplar donde quiere y a quien quiere, así como se sopla una débil brasa para hacer un fuego, y finalmente que éste devenga en hoguera.",
    ],
  },

  {
    slug: "sobre-el-hermetismo",
    titulo: "Sobre el Hermetismo",
    fechaISO: "2022-10-25",
    fechaLegible: "25 de octubre de 2022",
    categoria: "Hermetismo",
    autor: "Emanuel Mari",
    simbolo: "☿",
    resumen:
      "El hermetismo no es una doctrina antigua «supersticiosa». Es una ciencia real que devela el poder metafísico residente en el ser humano, uniendo lo interior y lo exterior.",
    parrafos: [
      "Como alguna vez lo hemos mencionado, el hermetismo no se reduce a una doctrina antigua entendida y etiquetada muchas veces como «supersticiosa». Muy por el contrario, nos permitimos decir que el conocimiento legado por los sabios se encuentra dentro de los cánones más elevados del empirismo, puesto que es el conocimiento real que cumple la función de develar y experimentar el poder metafísico residente en el ser humano, valiéndose de secretos celosamente guardados por naturaleza.",
      "A través de la resonancia natural estudia y conoce las distintas correspondencias entre los fragmentos que componen todo lo creado como un cuerpo total y absoluto, basándose en lo infinitesimal: en lo micro y reproducido en lo macro.",
      "Sí, el hermetismo es una ciencia capaz de dar peso y medida a lo inefable, logrando de esta manera hacer visible lo que por invisible (a ojos profanos) se rechaza de manera categórica por ignorancia. La sacra ciencia no sólo se ocupa del plano interior, espiritual o metafísico; también del plano sensorial, exterior y físico, uniendo lo que ilusoriamente está separado. Ambos aspectos de la creación son sólo en apariencia contrarios o antagónicos, pero juntos componen una sola y única cosa.",
      "Es así como los eruditos, los sofistas y otros simples sopladores hacen mal uso del conocimiento legado por Hermes, Platón y otros tantos filósofos naturalistas, intentando engendrar, por desconocimiento, seudorreligiones de una mística extraña que hunde sus cimientos en sincretismos vanos de símbolos arcaicos, significándolos y revistiéndolos de conceptos humanos, sociales, y por completo carentes de la hermenéutica tradicional y trascendente. Estas significaciones múltiples y del todo especulativas sólo pueden circunvalar el núcleo mismo del misterio que ocultan, convirtiendo al hermetismo (ahora sí de manera válida) en un hecho desafortunado que roza la creencia supersticiosa.",
      "Tomemos el caso de las religiones, que han desencarnado en bloque todo el conocimiento que en ellas se ocultó por temor, volviéndose enteramente de orden exotérico en sus símbolos litúrgicos; símbolos que, en definitiva, muy pocos comprenden en su sentido último y verdadero. Es así como los sacerdotes están cada día más alejados del pontificado auténtico, el cual tiene como función ser «puente» para la necesaria unión entre el cielo y la tierra, y en cambio se han tornado doctores de la ley, ajustándose a la jurisprudencia del culto: defensores ciegos de una justicia divina que no conocen ni gobiernan. A raíz de este alejamiento del centro han perdido por completo la llave que conduce a la sabiduría eterna, convirtiendo, producto de su estulticia, los símbolos trascendentes en meros signos para una doctrina moral que condena o libera según la ley coja y jorobada de los hombres. ¡Cuántos desahuciados ruegan por el milagro de la sanación del cuerpo, pero qué pocos son los beneficiados por un prodigio semejante! Y para colmo, estos pocos siempre quedarán sujetos a sospechas del todo razonables.",
      "Éste es el resultado de una mística masificada, carente de sabiduría: cultos sin espíritu ni fe auténtica.",
      "La mística y la ciencia hermética no deben separarse, porque en definitiva, al igual que el cielo y la tierra, deben ser complementos para la unión en el sendero que finaliza en la verdad única, Realidad sustancial y tangible ya desde aquí abajo.",
    ],
  },
];

/** Obtener un post por slug de forma tipada. */
export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

/** Posts ordenados por fecha descendente (más nuevo primero). */
export function getPostsOrdenados(): Post[] {
  return [...posts].sort((a, b) => b.fechaISO.localeCompare(a.fechaISO));
}
