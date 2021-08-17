import loadable from '@loadable/component';

const PDF = loadable(async () =>
  import(/* webpackChunkName: "LazyLoadPDF" */ './components/PDF.js')
);
const PDFPage = loadable(async () =>
  import(/* webpackChunkName: "LazyLoadPDFPage" */ './components/PDFPage.js')
);

export { PDF, PDFPage };
