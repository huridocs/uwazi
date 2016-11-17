import {isClient} from 'app/utils';
let PDFJS;
if (isClient) {
  PDFJS = require('../../../node_modules/pdfjs-dist/web/pdf_viewer.js').PDFJS;
  PDFJS.workerSrc = '/pdf.worker.bundle.js';
}

const countPageChars = (page) => {
  return new Promise((resolve) => {
    const textLayerDiv = document.createElement('div');

    textLayerDiv.addEventListener('textlayerrendered',() => {
      //console.log(`RENDERED ! ${this.props.page}`);
      //console.log(textLayerDiv.innerText.length);
      //console.log('-----------------');
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

const countPDFChars = (pdfFile) => {
  return new Promise((resolve) => {
    PDFJS.getDocument(pdfFile)
    .then(pdf => {
      let pages = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        pages.push(pdf.getPage(pageNumber).then(countPageChars));
      }

      return Promise.all(pages)
      .then((result) => {
        let count = {};
        result.forEach((length, index) => {
          count[index + 1] = length;
          if (count[index]) {
            count[index + 1] += count[index];
          }
        });
        resolve(count);
      });
    });
  });
};

export {countPDFChars};
