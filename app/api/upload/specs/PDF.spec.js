import PDFObject from '../PDF.js';
import childProcess from 'child_process';
import EventEmitter from 'events';

class Events extends EventEmitter {}

fdescribe('PDF', function () {
  let pdf;

  describe('extractText', () => {
    let filepath = __dirname + '/12345.test.pdf';
    beforeEach(() => {
      pdf = new PDFObject(filepath);
    });

    fit('should extract the text of the pdf by page', (done) => {
      pdf.extractText()
      .then((pages) => {
        expect(pages[1]).toMatch(/Page 1/);
        expect(pages[2]).toMatch(/Page 2/);
        expect(pages[3]).toMatch(/Page 3/);
        done();
      })
      .catch(done.fail);
    });

    it('should reject the promise on error', (done) => {
      let commandBeingExecuted = new Events();
      commandBeingExecuted.stdout = new Events();
      commandBeingExecuted.stderr = new Events();
      commandBeingExecuted.stdout.pipe = () => {};
      commandBeingExecuted.stderr.pipe = () => {};
      spyOn(childProcess, 'spawn').and.returnValue(commandBeingExecuted);

      pdf.extractText()
      .then(() => {
        done.fail('promise should be rejected when there is an exit code === 1');
      })
      .catch((error) => {
        expect(error.toString().indexOf('no such file or directory') > -1).toBe(true);
        done();
      });

      commandBeingExecuted.stdout.emit('close', 'error');
    });
  });


  describe('convert', () => {
    let filepath = __dirname + '/12345.test.pdf';
    beforeEach(() => {
      pdf = new PDFObject(filepath);
    });

    //afterEach((done) => {
      //if (pdf.optimizedPath) {
        //fs.unlink(pdf.optimizedPath, done);
      //} else {
        //done();
      //}
    //});

    it('should optimize and extract html and text', (done) => {
      pdf.convert()
      .then((conversion) => {
        expect(conversion.fullText).toMatch('Page 1');
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
