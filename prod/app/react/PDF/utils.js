"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _PDFJS = _interopRequireDefault(require("./PDFJS"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const PDFUtils = {
  extractPDFInfo: pdfFile => new Promise(resolve => {
    _PDFJS.default.getDocument(pdfFile).promise.
    then(pdf => {
      const pages = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        pages.push(pdf.getPage(pageNumber).then(PDFUtils.extractPageInfo));
      }

      return Promise.all(pages).
      then(result => {
        const count = {};
        result.forEach((length, index) => {
          count[index + 1] = {
            chars: length };

          if (count[index]) {
            count[index + 1].chars += count[index].chars;
          }
        });
        resolve(count);
      });
    });
  }),

  extractPageInfo: page => new Promise(resolve => {
    const textLayerDiv = document.createElement('div');
    textLayerDiv.className = 'textLayer';

    page.getTextContent({ normalizeWhitespace: true }).
    then(textContent => {
      const textLayer = _PDFJS.default.renderTextLayer({
        textContent,
        container: textLayerDiv,
        viewport: page.getViewport({
          scale: 1 }) });



      textLayer.promise.then(() => {
        resolve(textLayerDiv.innerText.length);
      });
    });
  }) };var _default =


PDFUtils;exports.default = _default;