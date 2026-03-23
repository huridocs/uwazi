// This override is needed to avoid our forced font-family from breaking
// other tools like Monaco code editor and PDFJS.The custom font is forced on the rendering
// breaking styles and functionality.
const globalFontOverride = {
  '.tw-content *:not(.monaco-code-editor-container):not(.monaco-code-editor-container *):not(#pdf-container .textLayer):not(#pdf-container .textLayer *)':
    {
      'font-family': "'Inter', sans-serif !important",
    },
};

module.exports = globalFontOverride;
