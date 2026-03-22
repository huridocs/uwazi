import * as pdfjs from 'pdfjs-dist';
import { EventBus } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { isClient } from '#app/utils/index.js';

let PDFJS = {};
let pdfjsLib = {};

const pdfjsLoader = async () => {
  if (isClient) {
    PDFJS = await import('pdfjs-dist/web/pdf_viewer.mjs');

    if (window.Cypress) {
      pdfjsLib = await import('pdfjs-dist/webpack.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = null;
    } else if (process.env.NODE_ENV === 'production') {
      pdfjsLib = await import('pdfjs-dist/webpack.mjs');
    } else {
      pdfjsLib = pdfjs;
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    }
  }
};

await pdfjsLoader();

const PDFJSExport = { ...PDFJS, ...pdfjsLib };
export { PDFJSExport as PDFJS, EventBus };
