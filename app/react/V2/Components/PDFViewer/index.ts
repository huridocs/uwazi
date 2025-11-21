import loadable from '@loadable/component';

import * as selectionHandlers from './functions/handleTextSelection';

const PDF = loadable(
  async () => {
    const module = await import(/* webpackChunkName: "LazyLoadPDF" */ './PDF');
    return module.PDF;
  },
  { ssr: false }
);

export { pdfEventBus } from './events';
export { PDF, selectionHandlers };
export { calculateScaling } from './functions/calculateScaling';
