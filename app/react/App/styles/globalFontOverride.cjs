// This override is needed to avoid our forced font-family from breaking
// other tools like Monaco code editor and PDFJS.The custom font is forced on the rendering
// breaking styles and functionality.
const globalFontOverride = {
  '.tw-content *:not(.monaco-code-editor-container):not(.monaco-code-editor-container *):not(#pdf-container .textLayer):not(#pdf-container .textLayer *):not(.entity-plaintext-mono):not(.entity-plaintext-mono *):not([data-entity-plaintext]):not([data-entity-plaintext] *)':
    {
      'font-family': "'Inter', sans-serif !important",
    },
  '.tw-content .entity-plaintext-mono, .tw-content .entity-plaintext-mono *, .tw-content [data-entity-plaintext], .tw-content [data-entity-plaintext] *':
    {
      'font-family': '"JetBrains Mono", ui-monospace, monospace !important',
    },
};

module.exports = globalFontOverride;
