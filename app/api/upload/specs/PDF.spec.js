import PDFObject from '../PDF.js';

describe('PDF', function () {
  let pdf;

  describe('extractText', () => {
    let filepath = __dirname + '/12345.test.pdf';
    beforeEach(() => {
      pdf = new PDFObject(filepath);
    });

    it('should extract the text of the pdf by page, every word on every page should have appended the page number in between [[]]', (done) => {
      pdf.extractText()
      .then((text) => {
        let lines = text.split(/\f/);
        expect(lines[0]).toBe('Page[[1]] 1[[1]]');
        expect(lines[1]).toBe('Page[[2]] 2[[2]]');
        expect(lines[2]).toBe('Page[[3]] 3[[3]]');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('convert', () => {
    let filepath = __dirname + '/12345.test.pdf';
    beforeEach(() => {
      pdf = new PDFObject(filepath);
    });

    it('should optimize and extract html and text', (done) => {
      pdf.convert()
      .then((conversion) => {
        let lines = conversion.fullText.split(/\f/);

        expect(lines[0]).toBe('Page[[1]] 1[[1]]');
        //expect(conversion.fullText).toMatch('Page\[\[1\]\] 1');
        done();
      })
      .catch(done.fail);
    });

    describe('when there is a conversion error', () => {
      it('should throw a conversion_error', (done) => {
        spyOn(pdf, 'extractText').and.returnValue(Promise.reject());
        pdf.convert()
        .then(() => {
          done.fail('should have thrown a conversion_error');
        })
        .catch(error => {
          expect(error).toEqual({error: 'conversion_error'});
          done();
        });
      });
    });
  });
});
