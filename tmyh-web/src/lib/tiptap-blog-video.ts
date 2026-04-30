import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blogVideo: {
      setBlogVideo: (options: { src: string }) => ReturnType;
    };
  }
}

/** Vídeo HTML5 (archivo subido o URL directa a mp4/webm/etc.), aparte del embed de YouTube. */
export const BlogVideo = Node.create({
  name: "blogVideo",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "video[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: true,
        playsInline: true,
        class: "blog-content-video",
      }),
    ];
  },

  addCommands() {
    return {
      setBlogVideo:
        (options: { src: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
