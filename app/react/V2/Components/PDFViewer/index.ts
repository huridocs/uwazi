import loadable from '@loadable/component';

import * as selectionHandlers from '#V2/Components/PDFViewer/functions/handleTextSelection.js';

const PDF = loadable(
  async () => (await import(/* webpackChunkName: "LazyLoadPDF" */ './PDF')).PDF,
  {
    ssr: false,
  }
);

export type { Snippet } from '#V2/Components/PDFViewer/events.js';
export { pdfEventBus } from '#V2/Components/PDFViewer/events.js';
export { PDF, selectionHandlers };
export { calculateScaling } from '#V2/Components/PDFViewer/functions/calculateScaling.js';
