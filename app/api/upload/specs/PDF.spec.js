import PDFObject from '../PDF.js';
import childProcess from 'child_process';
import EventEmitter from 'events';

class Events extends EventEmitter {}

fdescribe('PDF', function () {
  let pdf;
  let filepath = '/the/pdf/path.pdf';
  //let filepath = __dirname + '/test_document.pdf';

  beforeEach(() => {
    pdf = new PDFObject(filepath);
  });

  describe('optimize', () => {
    let ghostscript = {stdout: new Events(), stderr: new Events()};
    beforeEach(() => {
      spyOn(childProcess, 'spawn').and.returnValue(ghostscript);
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
      ghostscript.stdout.emit('data', new Buffer('Processing pages 1 through 11.', 'utf-8'));
      ghostscript.stdout.emit('data', new Buffer('Page 5', 'utf-8'));
    });

    it('should return a promise and resolve it when conversion finishes', (done) => {
      pdf.optimize()
      .then((optimizedPath) => {
        expect(optimizedPath).toBe('/the/pdf/path.optimized.pdf');
        done();
      }).catch(done.fail);

      ghostscript.stdout.emit('close');
    });

    it('should reject the promise on error', (done) => {
      pdf.optimize()
      .then(() => {
        done.fail('promise should be rejected');
      })
      .catch((error) => {
        expect(error).toBe('error!');
        done();
      });

      ghostscript.stderr.emit('data', 'error!');
    });
  });
});
