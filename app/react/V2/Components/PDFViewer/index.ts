import loadable from '@loadable/component';

const PDF = loadable(async () => import(/* webpackChunkName: "LazyLoadPDF" */ './PDF'));

export { PDF };
