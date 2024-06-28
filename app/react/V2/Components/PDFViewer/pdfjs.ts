import * as pdfJsDist from 'pdfjs-dist';
import * as viewer from 'pdfjs-dist/web/pdf_viewer.mjs';
import 'pdfjs-dist/web/pdf_viewer.css';

let pdfjs = pdfJsDist;
const PDFJSViewer = viewer;
const { EventBus } = viewer;
const CMAP_URL = 'legacy_character_maps';

const pdfjsLoader = async () => {
  if (!process.env.HOT && !(process.env.NODE_ENV === 'test')) {
    //@ts-ignore
    //webpack bundled version for production, types are not needed.
    pdfjs = await import('pdfjs-dist/webpack.mjs');
  }
};

await pdfjsLoader();

const PDFJS = pdfjs;

export { PDFJS, PDFJSViewer, EventBus, CMAP_URL };
