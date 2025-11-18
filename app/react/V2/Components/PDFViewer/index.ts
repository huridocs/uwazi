import loadable from '@loadable/component';
import * as selectionHandlers from './functions/handleTextSelection';

const PDF = loadable(async () => import(/* webpackChunkName: "LazyLoadPDF" */ './PDF'), {
  ssr: false,
});

export { PDF, selectionHandlers };
export { calculateScaling } from './functions/calculateScaling';
