const isClient = typeof window !== 'undefined';

let pdfjs: typeof import('pdfjs-dist') | null = null;
let PDFJSViewer: typeof import('pdfjs-dist/web/pdf_viewer.mjs') | null = null;
let EventBus: typeof import('pdfjs-dist/web/pdf_viewer.mjs').EventBus | null = null;
const CMAP_URL = 'legacy_character_maps';

const pdfjsLoader = async () => {
  if (isClient) {
    const pdfJsDist = await import('pdfjs-dist');
    await import('pdfjs-dist/web/pdf_viewer.css');
    const viewer = await import('pdfjs-dist/web/pdf_viewer.mjs');
    PDFJSViewer = viewer;
    EventBus = viewer.EventBus;

    if (process.env.NODE_ENV === 'production') {
      //@ts-ignore
      //webpack bundled version for production, types are not needed.
      pdfjs = await import('pdfjs-dist/webpack.mjs');
    } else {
      pdfjs = pdfJsDist;
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    }
  }
};

await pdfjsLoader();

const PDFJS = pdfjs || {};

export { PDFJS, PDFJSViewer, EventBus, CMAP_URL };
