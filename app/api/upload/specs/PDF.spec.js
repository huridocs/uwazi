import PDFObject from '../PDF.js';
import childProcess from 'child_process';
import EventEmitter from 'events';

class Events extends EventEmitter {}

describe('PDF', function () {
  let pdf;

  describe('optimize', () => {
    let filepath = '/the/pdf/path.pdf';
    let commandBeingExecuted = new Events();
    commandBeingExecuted.stdout = new Events();
    commandBeingExecuted.stderr = new Events();
    commandBeingExecuted.stdout.pipe = () => {};
    commandBeingExecuted.stderr.pipe = () => {};
    beforeEach(() => {
      spyOn(childProcess, 'spawn').and.returnValue(commandBeingExecuted);
      pdf = new PDFObject(filepath);
    });

    it('should optimize the pdf with ghostscript', () => {
      pdf.optimize();
      let params = childProcess.spawn.calls.argsFor(0);
      let command = params[0];
      let options = params[1];

      expect(command).toBe('gs');
      expect(options[options.length - 1]).toBe(filepath);
      expect(options).toContain('-sOutputFile=/the/pdf/path.optimized.pdf');
    });

    it('should emit progress event with progress % and page number', (done) => {
      pdf.on('progress', (percent, page) => {
        expect(percent).toBe(45);
        expect(page).toBe(5);
        done();
      });

      pdf.optimize();
      commandBeingExecuted.stdout.emit('data', new Buffer('Processing pages 1 through 11.', 'utf-8'));
      commandBeingExecuted.stdout.emit('data', new Buffer('Page 5', 'utf-8'));
    });

    it('should return a promise and resolve it when conversion finishes', (done) => {
      pdf.optimize()
      .then((optimizedPath) => {
        expect(optimizedPath).toBe('/the/pdf/path.optimized.pdf');
        expect(pdf.optimizedPath).toBe('/the/pdf/path.optimized.pdf');
        done();
      }).catch(done.fail);

      commandBeingExecuted.stdout.emit('close');
    });

    it('should reject the promise on error', (done) => {
      pdf.optimize()
      .then(() => {
        done.fail('promise should be rejected when there is an exit code === 1');
      })
      .catch((error) => {
        expect(error).toBe(1);
        done();
      });

      commandBeingExecuted.emit('close', 1);
    });
  });

  describe('extractText', () => {
    let filepath = __dirname + '/12345.test.pdf';
    beforeEach(() => {
      pdf = new PDFObject(filepath);
    });

    it('should extract the text of the pdf using docsplit', (done) => {
      pdf.extractText()
      .then((text) => {
        let lines = text.split(/\f/);

        expect(lines[0]).toBe('Page 1\n\n');
        expect(lines[1]).toBe('Page 2\n\n');
        expect(lines[2]).toBe('Page 3\n\n');
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
        expect(error).toBe(1);
        done();
      });

      commandBeingExecuted.emit('close', 1);
    });
  });

  describe('toHTML', () => {
    let filepath = __dirname + '/12345.test.pdf';
    beforeEach(() => {
      pdf = new PDFObject(filepath);
      pdf.optimizedPath = filepath;
    });

    it('should extract html pages in order', (done) => {
      pdf.toHTML()
      .then((conversion) => {
        let pages = conversion.pages;
        expect(pages.length).toBe(11);
        expect(pages[0].match(/Page 1/)[0]).toBe('Page 1');
        expect(pages[1].match(/Page 2/)[0]).toBe('Page 2');
        expect(pages[2].match(/Page 3/)[0]).toBe('Page 3');

        done();
      })
      .catch(done.fail);
    });

    it('should extract and divide the custom css file fonts and css', (done) => {
      pdf.toHTML()
      .then((conversion) => {
        expect(!!conversion.fonts.match(/font-face/)).toBe(true);
        expect(!!conversion.css.match(/ff0/)).toBe(true);

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

      pdf.toHTML()
      .then(() => {
        done.fail('promise should be rejected when there is an exit code === 1');
      })
      .catch((error) => {
        expect(error).toBe(1);
        done();
      });

      commandBeingExecuted.emit('close', 1);
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
        expect(conversion.pages.length).toBe(11);
        expect(conversion.fullText).toMatch('Page 1');
        expect(!!conversion.css.match(/ff0/)).toBe(true);
        expect(!!conversion.fonts.match(/font-face/)).toBe(true);
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
