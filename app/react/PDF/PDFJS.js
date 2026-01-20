/* eslint-disable import/no-mutable-exports, global-require, prefer-destructuring */
import { isClient } from '#app/utils/index.js';

let PDFJS = {};
let pdfjsLib = {};
let EventBus = null;

const pdfjsLoader = async () => {
  if (isClient && typeof window !== 'undefined') {
    const pdfjs = await import('pdfjs-dist');
    await import('pdfjs-dist/web/pdf_viewer.css');
    const viewerModule = await import('pdfjs-dist/web/pdf_viewer.mjs');
    PDFJS = viewerModule;
    EventBus = viewerModule.EventBus;

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
