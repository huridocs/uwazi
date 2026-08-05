// Legacy build includes polyfills (e.g. Promise.try) required by older browsers.
// See https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions#faq-support
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as viewer from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';
import type { PDFDocumentProxy } from 'pdfjs-dist';

const PDFJSViewer = viewer;
const { EventBus: PDFJSEventBus } = viewer;

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

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

type EventBusType = typeof EventBus.prototype;
const PDFJS = pdfjs;
const { PixelsPerInch } = pdfjs;
const CMAP_URL = '/legacy_character_maps/';
const WASM_URL = '/pdfjs_wasm/';

export type { PDFDocumentProxy, PDFEventMap, EventBusType };
export { PDFJS, PDFJSViewer, EventBus, CMAP_URL, WASM_URL, PixelsPerInch };
