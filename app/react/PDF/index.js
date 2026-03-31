import loadable from '@loadable/component';

const PDF = loadable(
  async () => {
    const prefetchPDFPage = import(
      /* webpackChunkName: "LazyLoadPDFPage" */ './components/PDFPage.js'
    );
    const mod = await import(/* webpackChunkName: "LazyLoadPDF" */ './components/PDF.js');
    prefetchPDFPage.catch(() => {});
    return mod.PDF;
  },
  { ssr: false }
);

const PDFPage = loadable(
  async () => {
    const mod = await import(/* webpackChunkName: "LazyLoadPDFPage" */ './components/PDFPage.js');
    return mod.PDFPage;
  },
  { ssr: false }
);

export { PDF, PDFPage };
