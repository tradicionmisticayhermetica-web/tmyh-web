import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blogPdf: {
      setBlogPdf: (options: { url: string; nombre?: string | null }) => ReturnType;
    };
  }
}

/** Adjunto PDF descargable (subido a Storage o URL pública). Sin render como imagen. */
export const BlogPdf = Node.create({
  name: "blogPdf",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: null },
      nombre: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "aside.blog-pdf-block",
        getAttrs: (node): false | { url: string; nombre: string | null } => {
          if (typeof node === "string" || !("querySelector" in node)) return false;
          const el = node as HTMLElement;
          const link = el.querySelector("a.blog-pdf-download");
          const href = link?.getAttribute("href")?.trim();
          if (!href) return false;
          const raw = el.getAttribute("data-nombre")?.trim();
          return { url: href, nombre: raw || null };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const url = node.attrs.url as string | null;
    const nombre = (node.attrs.nombre as string | null) || null;
    if (!url) {
      return ["aside", { class: "blog-pdf-block" }, ["span", {}, "PDF"]];
    }
    const label = nombre || "documento.pdf";
    return [
      "aside",
      mergeAttributes(
        { class: "blog-pdf-block" },
        nombre ? { "data-nombre": nombre } : {},
      ),
      ["span", { class: "blog-pdf-badge", "aria-hidden": "true" }, "PDF"],
      [
        "a",
        {
          href: url,
          class: "blog-pdf-download",
          download: "",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        `Descargar PDF · ${label}`,
      ],
    ];
  },

  addCommands() {
    return {
      setBlogPdf:
        (options: { url: string; nombre?: string | null }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              url: options.url,
              nombre: options.nombre ?? null,
            },
          });
        },
    };
  },
});
