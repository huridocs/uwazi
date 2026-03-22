import * as pdfJsDist from 'pdfjs-dist';
import * as viewer from 'pdfjs-dist/web/pdf_viewer.mjs';
import type { PDFDocumentProxy } from 'pdfjs-dist';

let pdfjs = pdfJsDist;
const PDFJSViewer = viewer;
const { EventBus: PDFJSEventBus } = viewer;
const CMAP_URL = 'legacy_character_maps/';

const pdfjsLoader = async () => {
  if (process.env.NODE_ENV === 'development') {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } else {
    //@ts-ignore
    //webpack bundled version for production, types are not needed.
    pdfjs = await import('pdfjs-dist/webpack.mjs');
  }
};

await pdfjsLoader();

const PDFJS = pdfjs;

type PDFEventMap = {
  pageready: { pageNumber: number };
  pagerendered: { pageNumber: number };
  renderpage: { pageNumber: number };
  unmountpage: { pageNumber: number };
};

class EventBus extends PDFJSEventBus {
  on<K extends keyof PDFEventMap>(eventName: K, listener: (data: PDFEventMap[K]) => void): void {
    super.on(eventName as string, listener as (data: object) => void);
  }

  off<K extends keyof PDFEventMap>(eventName: K, listener: (data: PDFEventMap[K]) => void): void {
    super.off(eventName as string, listener as (data: object) => void);
  }

  dispatch<K extends keyof PDFEventMap>(eventName: K, data: PDFEventMap[K]): void {
    super.dispatch(eventName as string, data);
  }
}

export type { PDFDocumentProxy, PDFEventMap };
export { PDFJS, PDFJSViewer, EventBus, CMAP_URL };
