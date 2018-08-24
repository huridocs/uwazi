import PDFObject from '../PDF.js';

describe('PDF', () => {
  let pdf;

  describe('convert', () => {
    const filepath = `${__dirname}/12345.test.pdf`;
    beforeEach(() => {
      pdf = new PDFObject(filepath);
    });

    it('should extract text indexed per page, with apended page in every word for elastic search purposes', async () => {
      const conversion = await pdf.convert();
      const pages = conversion.fullText;

      expect(pages[1]).toMatch('Page[[1]] 1[[1]]');
      expect(pages[2]).toMatch('Page[[2]] 2[[2]]');
      expect(pages[3]).toMatch('Page[[3]] 3[[3]]');
    });

    it('should return the total number of pages', async () => {
      const conversion = await pdf.convert();
      expect(conversion.totalPages).toBe(11);
    });
  });
});
