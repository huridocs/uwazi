import PDFObject from '../PDF.js';

describe('PDF', () => {
  let pdf;

  describe('extractText', () => {
    const filepath = `${__dirname}/12345.test.pdf`;
    beforeEach(() => {
      pdf = new PDFObject(filepath);
    });

    it('should extract the text of the pdf by page, every word on every page should have appended the page number in between [[]]', async () => {
      const text = await pdf.extractText();
      const lines = text.split(/\f/);

      expect(lines[0]).toBe('Page[[1]] 1[[1]]');
      expect(lines[1]).toBe('Page[[2]] 2[[2]]');
      expect(lines[2]).toBe('Page[[3]] 3[[3]]');
    });
  });

  describe('convert', () => {
    const filepath = `${__dirname}/12345.test.pdf`;
    beforeEach(() => {
      pdf = new PDFObject(filepath);
    });

    it('should extract text with apended page in every word for elastic search purposes', async () => {
      const conversion = await pdf.convert();
      const lines = conversion.fullText.split(/\f/);

      expect(lines[0]).toBe('Page[[1]] 1[[1]]');
    });

    it('should extract pseudo formated plain text per page', async () => {
      const conversion = await pdf.convert();
      const pages = conversion.formatted;

      expect(pages[0]).toMatch('Page 1');
      expect(pages[1]).toMatch('Page 2');
      expect(pages[2]).toMatch('Page 3');
    });

    describe('when there is a conversion error', () => {
      it('should throw a conversion_error', (done) => {
        spyOn(pdf, 'extractText').and.returnValue(Promise.reject());
        pdf.convert()
        .then(() => {
          done.fail('should have thrown a conversion_error');
        })
        .catch((error) => {
          expect(error).toEqual({ error: 'conversion_error' });
          done();
        });
      });
    });
  });
});
