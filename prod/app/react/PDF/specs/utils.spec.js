"use strict";var _utils = _interopRequireDefault(require("../utils"));
var _PDFJS = _interopRequireDefault(require("../PDFJS"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const mockDefaultTextLayerFactory = () => {
  let div;

  const renderTextLayer = ({ container }) => {
    div = container;
    div.innerText = 'test !';
    return {
      promise: Promise.resolve() };

  };

  _PDFJS.default.renderTextLayer = renderTextLayer;
};

describe('PDF utils', () => {
  let pdf;

  describe('extractPDFInfo', () => {
    beforeEach(() => {
      pdf = {
        numPages: 2,
        getPage: jest.fn().mockReturnValue(Promise.resolve()) };

      spyOn(_PDFJS.default, 'getDocument').and.returnValue({ promise: Promise.resolve(pdf) });
      spyOn(_utils.default, 'extractPageInfo').and.returnValue(Promise.resolve(55));
    });

    it('should return page character count added for all pages', done => {
      _utils.default.extractPDFInfo('pdfFile').
      then(pdfInfo => {
        expect(pdfInfo).toEqual({ 1: { chars: 55 }, 2: { chars: 110 } });
        done();
      });
    });
  });

  describe('extractPageInfo', () => {
    it('should return number of characters on the page', done => {
      const page = {
        getViewport: jest.fn(),
        getTextContent: jest.fn().mockReturnValue(Promise.resolve({})) };


      mockDefaultTextLayerFactory();

      _utils.default.extractPageInfo(page).
      then(chars => {
        expect(chars).toEqual(6);
        done();
      });
    });
  });
});