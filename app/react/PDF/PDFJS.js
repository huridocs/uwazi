/* eslint-disable import/no-mutable-exports, global-require, prefer-destructuring */
import { isClient } from 'app/utils';
import { EventBus } from 'pdfjs-dist/web/pdf_viewer';

let PDFJS = {};
let pdfjsLib = {};
let textLayerFactory = {};
if (isClient) {
  require('../../../node_modules/pdfjs-dist/web/pdf_viewer.css');

  PDFJS = require('../../../node_modules/pdfjs-dist/web/pdf_viewer.js');
  if (process.env.HOT || process.env.NODE_ENV === 'test') {
    pdfjsLib = require('pdfjs-dist');
  } else {
    pdfjsLib = require('pdfjs-dist/webpack');
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.entry');
  textLayerFactory = new PDFJS.DefaultTextLayerFactory();
}

export default { ...PDFJS, ...pdfjsLib };

export { textLayerFactory, EventBus };
