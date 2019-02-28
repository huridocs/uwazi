import PDFJS from './PDFJS';

const PDFUtils = {
  extractPDFInfo: pdfFile => new Promise((resolve) => {
    PDFJS.getDocument(pdfFile).promise
    .then((pdf) => {
      const pages = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        pages.push(pdf.getPage(pageNumber).then(PDFUtils.extractPageInfo));
      }

      return Promise.all(pages)
      .then((result) => {
        const count = {};
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
  }),

  extractPageInfo: page => new Promise((resolve) => {
    const textLayerDiv = document.createElement('div');
    textLayerDiv.className = 'textLayer';
    const textLayer = new PDFJS.DefaultTextLayerFactory().createTextLayerBuilder(textLayerDiv, null, page.getViewport({ scale: 1 }), true);

    document.addEventListener('textlayerrendered', () => {
      resolve(textLayerDiv.innerText.length);
      textLayer.cancel();
    });

    page.getTextContent({ normalizeWhitespace: true })
    .then((textContent) => {
      textLayer.setTextContent(textContent);
      textLayer.render();
    });
  })
};

export default PDFUtils;
