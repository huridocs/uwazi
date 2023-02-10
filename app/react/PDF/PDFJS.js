/* eslint-disable import/no-mutable-exports, global-require, prefer-destructuring */
import { isClient } from 'app/utils';
import { EventBus } from 'pdfjs-dist/web/pdf_viewer';

let PDFJS = {};
let pdfjsLib = {};

if (isClient) {
  require('../../../node_modules/pdfjs-dist/web/pdf_viewer.css');
  PDFJS = require('../../../node_modules/pdfjs-dist/web/pdf_viewer.js');
  pdfjsLib = require('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.entry');
}

export default { ...PDFJS, ...pdfjsLib };

export { EventBus };
