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

    if (process.env.NODE_ENV === 'production') {
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

export default { ...PDFJS, ...pdfjsLib };
export { EventBus };
