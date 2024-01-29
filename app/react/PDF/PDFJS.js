/* eslint-disable import/no-mutable-exports, global-require, prefer-destructuring */
import * as pdfjs from 'pdfjs-dist';
import { EventBus } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { isClient } from 'app/utils';

let PDFJS = {};
let pdfjsLib = {};

const pdfjsLoader = async () => {
  if (isClient) {
    import('pdfjs-dist/web/pdf_viewer.css');
    PDFJS = await import('pdfjs-dist/web/pdf_viewer.mjs');

    if (process.env.HOT || process.env.NODE_ENV === 'test') {
      pdfjsLib = pdfjs;
      pdfjsLib.GlobalWorkerOptions.workerSrc = await import('pdfjs-dist/build/pdf.worker.min.mjs');
    } else {
      pdfjsLib = await import('pdfjs-dist/webpack.mjs');
    }
  }
};

await pdfjsLoader();

export default { ...PDFJS, ...pdfjsLib };
export { EventBus };
