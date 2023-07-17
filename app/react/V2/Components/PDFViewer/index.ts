import loadable from '@loadable/component';

const PDF = loadable(async () => import(/* webpackChunkName: "LazyLoadPDF" */ './PDF'));

// const PDFPage = loadable(
//   async () => import(/* webpackChunkName: "LazyLoadPDFPage" */ './components/PDFPage.js')
// );

export { PDF };
