import { EventBus } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { isClient } from '#app/utils/index.js';

let PDFJS = {};
let pdfjsLib = {};

const pdfjsLoader = async () => {
  if (isClient) {
    PDFJS = await import('pdfjs-dist/web/pdf_viewer.mjs');
    pdfjsLib = await import('pdfjs-dist/webpack.mjs');
  }
};

await pdfjsLoader();

const PDFJSExport = { ...PDFJS, ...pdfjsLib };
export { PDFJSExport as PDFJS, EventBus };
