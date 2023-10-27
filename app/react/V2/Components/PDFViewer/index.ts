import loadable from '@loadable/component';
import * as selectionHandlers from './functions/handleTextSelection';

const PDF = loadable(async () => import(/* webpackChunkName: "LazyLoadPDF" */ './PDF'));

export { PDF, selectionHandlers };
