import { isClient } from 'app/utils';
import { EventBus } from 'pdfjs-dist/web/pdf_viewer';
import 'pdfjs-dist/build/pdf.worker.entry';

let viewer = {};
let module = {};

if (isClient) {
  viewer = import('pdfjs-dist/web/pdf_viewer');

  //   if (process.env.HOT || process.env.NODE_ENV === 'test') {
  //     module = import('pdfjs-dist');
  //   } else {
  //     module = import('pdfjs-dist/webpack');
  //   }

  module = import('pdfjs-dist');
  //   module.GlobalWorkerOptions.workerSrc = import('pdfjs-dist/build/pdf.worker.entry');

  //   dist.GlobalWorkerOptions.workerSrc = import('pdfjs-dist/build/pdf.worker.entry');
}

const PDFJS = { ...module, ...viewer };

export { PDFJS, EventBus };
