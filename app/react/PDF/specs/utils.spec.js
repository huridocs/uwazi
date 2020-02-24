/**
 * @jest-environment jsdom
 */
import PDFUtils from '../utils';
import PDFJS from '../PDFJS';

const mockDefaultTextLayerFactory = () => {
  let div;

  const renderTextLayer = ({ container }) => {
    div = container;
    div.innerText = 'test !';
    return {
      promise: Promise.resolve(),
    };
  };

  PDFJS.renderTextLayer = renderTextLayer;
};

describe('PDF utils', () => {
  let pdf;

  describe('extractPDFInfo', () => {
    beforeEach(() => {
      pdf = {
        numPages: 2,
        getPage: jest.fn().mockReturnValue(Promise.resolve()),
      };
      spyOn(PDFJS, 'getDocument').and.returnValue({ promise: Promise.resolve(pdf) });
      spyOn(PDFUtils, 'extractPageInfo').and.returnValue(Promise.resolve(55));
    });

    it('should return page character count added for all pages', done => {
      PDFUtils.extractPDFInfo('pdfFile').then(pdfInfo => {
        expect(pdfInfo).toEqual({ 1: { chars: 55 }, 2: { chars: 110 } });
        done();
      });
    });
  });

  describe('extractPageInfo', () => {
    it('should return number of characters on the page', done => {
      const page = {
        getViewport: jest.fn(),
        getTextContent: jest.fn().mockReturnValue(Promise.resolve({})),
      };

      mockDefaultTextLayerFactory();

      PDFUtils.extractPageInfo(page).then(chars => {
        expect(chars).toEqual(6);
        done();
      });
    });
  });
});
