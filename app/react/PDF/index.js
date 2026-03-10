import loadable from '@loadable/component';

const PDF = loadable(() => import(/* webpackChunkName: "LazyLoadPDF" */ './components/PDF.js'));
const PDFPage = loadable(
  () => import(/* webpackChunkName: "LazyLoadPDFPage" */ './components/PDFPage.js')
);

export { PDF, PDFPage };
