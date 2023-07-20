import * as dist from 'pdfjs-dist';
import * as viewer from 'pdfjs-dist/web/pdf_viewer';
import 'pdfjs-dist/web/pdf_viewer.css';

const PDFJS = dist;
const PDFJSViewer = viewer;
const { EventBus } = viewer;
const CMAP_URL = '../../../../../node_modules/pdfjs-dist/cmaps/';

if (typeof window !== 'undefined' && 'Worker' in window) {
  PDFJS.GlobalWorkerOptions.workerPort = new Worker(
    new URL('../../../../../node_modules/pdfjs-dist/build/pdf.worker.js', import.meta.url)
  );
}

export { PDFJS, PDFJSViewer, EventBus, CMAP_URL };
