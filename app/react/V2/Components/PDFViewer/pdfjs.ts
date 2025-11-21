import * as pdfJsDist from 'pdfjs-dist';
import * as viewer from 'pdfjs-dist/web/pdf_viewer.mjs';
import 'pdfjs-dist/web/pdf_viewer.css';

let pdfjs = pdfJsDist;
const PDFJSViewer = viewer;
const { EventBus } = viewer;
const CMAP_URL = 'legacy_character_maps';

const pdfjsLoader = async () => {
  if (process.env.NODE_ENV === 'production') {
    //@ts-ignore
    //webpack bundled version for production, types are not needed.
    pdfjs = await import('pdfjs-dist/webpack.mjs');
  } else {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }
};

await pdfjsLoader();

const PDFJS = pdfjs;

export { PDFJS, PDFJSViewer, EventBus, CMAP_URL };
