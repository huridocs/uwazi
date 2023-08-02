/* eslint-disable global-require */
import * as pdfJsDist from 'pdfjs-dist';
import * as viewer from 'pdfjs-dist/web/pdf_viewer';
import 'pdfjs-dist/web/pdf_viewer.css';

let pdfjs;
const PDFJSViewer = viewer;
const { EventBus } = viewer;
const CMAP_URL = 'legacy_character_maps';

if (process.env.HOT || process.env.NODE_ENV === 'test') {
  //this is to trigger pdfjs-dist fake worker instantiation in non production environments
  const fakeWorker = require('pdfjs-dist//build/pdf.worker.entry.js');
  pdfjs = pdfJsDist;
  pdfjs.GlobalWorkerOptions.workerSrc = fakeWorker;
} else {
  pdfjs = require('pdfjs-dist/webpack');
}

const PDFJS: typeof pdfjs = pdfjs;

export { PDFJS, PDFJSViewer, EventBus, CMAP_URL };
