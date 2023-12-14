import * as pdfJsDist from 'pdfjs-dist';
import * as viewer from 'pdfjs-dist/web/pdf_viewer.mjs';
import 'pdfjs-dist/web/pdf_viewer.css';

let pdfjs;
const PDFJSViewer = viewer;
const { EventBus } = viewer;
const CMAP_URL = 'legacy_character_maps';

const pdfjsLoader = async () => {
  if (process.env.HOT || process.env.NODE_ENV === 'test') {
    //@ts-ignore
    //this is to trigger pdfjs-dist fake worker instantiation in non production environments
    const fakeWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs');
    pdfjs = pdfJsDist;
    pdfjs.GlobalWorkerOptions.workerSrc = fakeWorker;
  } else {
    //@ts-ignore
    //webpack bundled version for production, types are not needed.
    pdfjs = await import('pdfjs-dist/webpack.mjs');
  }
};

await pdfjsLoader();

const PDFJS: typeof pdfjs = pdfjs;

export { PDFJS, PDFJSViewer, EventBus, CMAP_URL };
