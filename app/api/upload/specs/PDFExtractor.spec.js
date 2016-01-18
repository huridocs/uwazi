import extractPDF from '../PDFExtractor.js'

describe("PDFExtractor", () => {

  beforeEach(() => {
  });

  it('should extract html pages in order', (done) => {
    extractPDF(__dirname+'/test_document.pdf')
    .then((document) => {

      let pages = document.pages;

      expect(pages.length).toBe(11);
      expect(pages[0].match(/Page 1/)[0]).toBe('Page 1');
      expect(pages[1].match(/Page 2/)[0]).toBe('Page 2');
      expect(pages[2].match(/Page 3/)[0]).toBe('Page 3');

      done();
    })
    .catch(done.fail)
  });

  it('should extract styles in order', (done) => {
    extractPDF(__dirname+'/test_document.pdf')
    .then((document) => {
      let css = document.css;

      expect(css[0].match(/Base CSS/)[0]).toBe('Base CSS');
      expect(css[1].match(/Fancy/)[0]).toBe('Fancy');
      expect(css[2].match(/font-face/)[0]).toBe('font-face');

      done();
    })
    .catch(done.fail)
  });

});
