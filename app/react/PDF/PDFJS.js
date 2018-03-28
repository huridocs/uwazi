import {isClient} from 'app/utils';
let PDFJS;
if (isClient) {
  require('../../../node_modules/pdfjs-dist/web/pdf_viewer.css');
  PDFJS = require('../../../node_modules/pdfjs-dist/web/pdf_viewer.js').PDFJS;
  if (process.env.HOT) {
    PDFJS.workerSrc = 'http://localhost:8080/pdf.worker.js';
  } else {
    PDFJS.workerSrc = '/pdf.worker.js';
  }
}

export default PDFJS;
