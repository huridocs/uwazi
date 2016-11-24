import {isClient} from 'app/utils';
let PDFJS;
if (isClient) {
  PDFJS = require('../../../node_modules/pdfjs-dist/web/pdf_viewer.js').PDFJS;
  PDFJS.workerSrc = '/pdf.worker.bundle.js';
}

const extractPageInfo = (page) => {
  return new Promise((resolve) => {
    const textLayerDiv = document.createElement('div');

    textLayerDiv.addEventListener('textlayerrendered', () => {
      resolve(textLayerDiv.innerText.length);
    });

    //to get height/width ?
    //const canvas = document.createElement('div');
    //let scale = 1;
    //let pdfPageView = new PDFJS.PDFPageView({
      //container: canvas,
      //id: page.pageIndex,
      //scale: scale,
      //defaultViewport: page.getViewport(scale)
    //});

    //pdfPageView.setPdfPage(page);
    //pdfPageView.draw()
    //.then(() => {
      //console.log(pdfPageView);
    //});

    textLayerDiv.className = 'textLayer';
    let textLayer = new PDFJS.DefaultTextLayerFactory().createTextLayerBuilder(textLayerDiv, null, page.getViewport(1), true);
    page.getTextContent({normalizeWhitespace: true})
    .then((textContent) => {
      textLayer.setTextContent(textContent);
      textLayer.render();
    });
  });
};

const extractPDFInfo = (pdfFile) => {
  return new Promise((resolve) => {
    PDFJS.getDocument(pdfFile)
    .then(pdf => {
      let pages = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        pages.push(pdf.getPage(pageNumber).then(extractPageInfo));
      }

      return Promise.all(pages)
      .then((result) => {
        let count = {};
        result.forEach((length, index) => {
          count[index + 1] = {
            chars: length
          };
          if (count[index]) {
            count[index + 1].chars += count[index].chars;
          }
        });
        resolve(count);
      });
    });
  });
};

export default {extractPDFInfo};
