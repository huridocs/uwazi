import * as pdfjsDist from 'pdfjs-dist';

const pdfjs = pdfjsDist;

if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerPort = new Worker(
    new URL('../../../../../node_modules/pdfjs-dist/build/pdf.worker.js', import.meta.url)
  );
}

export { pdfjs };
