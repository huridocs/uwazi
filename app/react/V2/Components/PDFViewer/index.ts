import loadable from '@loadable/component';

import * as selectionHandlers from './functions/handleTextSelection';

const PDF = loadable(
  async () => (await import(/* webpackChunkName: "LazyLoadPDF" */ './PDF')).PDF,
  {
    ssr: false,
  }
);

export type { Snippet, PDFHandle } from './PDF';
export { pdfEventBus } from './events';
export { PDF, selectionHandlers };
export { calculateScaling } from './functions/calculateScaling';
