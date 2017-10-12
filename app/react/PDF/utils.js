import {isClient} from 'app/utils';
let PDFJS;
if (isClient) {
  PDFJS = require('../../../node_modules/pdfjs-dist/web/pdf_viewer.js').PDFJS;
  PDFJS.workerSrc = window.pdfWorkerPath;
}

const extractPageInfo = (page) => {
  return new Promise((resolve) => {
    const textLayerDiv = document.createElement('div');

    textLayerDiv.addEventListener('textlayerrendered', () => {
      resolve(textLayerDiv.innerText.length);
    });

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
