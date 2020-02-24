/* eslint-disable import/no-mutable-exports, global-require, prefer-destructuring */
import { isClient } from 'app/utils';

let PDFJS = {};
let pdfjsLib = {};
let textLayerFactory = {};
if (isClient) {
  require('../../../node_modules/pdfjs-dist/web/pdf_viewer.css');

  PDFJS = require('../../../node_modules/pdfjs-dist/web/pdf_viewer.js');
  if (process.env.HOT || process.env.NODE_ENV === 'test') {
    pdfjsLib = require('pdfjs-dist');
    // pdfjsLib.workerSrc = 'http://localhost:8080/pdf.worker.js';
  } else {
    pdfjsLib = require('pdfjs-dist/webpack');
  }
  textLayerFactory = new PDFJS.DefaultTextLayerFactory();
}

export default { ...PDFJS, ...pdfjsLib };

export { textLayerFactory };
