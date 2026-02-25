import loadable from '@loadable/component';

import * as selectionHandlers from './functions/handleTextSelection.js';

const PDF = loadable(
  async () => (await import(/* webpackChunkName: "LazyLoadPDF" */ './PDF')).PDF,
  {
    ssr: false,
  }
);

export type { Snippet, PDFHandle } from './PDF.js';
export { pdfEventBus } from './events.js';
export { PDF, selectionHandlers };
export { calculateScaling } from './functions/calculateScaling.js';
