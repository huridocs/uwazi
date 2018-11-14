import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child-process-promise';
import errorLog from 'api/log/errorLog';
import debugLog from 'api/log/debugLog';

export default class PDF extends EventEmitter {
  constructor(filepath) {
    super();
    this.filepath = filepath;
    this.optimizedPath = filepath;
  }

  getThumbnailPath(documentId) {
    return path.join(path.dirname(this.filepath), documentId);
  }

  async attemptOcr() {
    try {
      // check that both tesseract and convert exist system-wide
      const res1 = await spawn('tesseract', ['--version'], { capture: ['stdout', 'stderr'] });
      debugLog.debug(res1.stdout);
      const res2 = await spawn('convert', ['--version'], { capture: ['stdout', 'stderr'] });
      debugLog.debug(res1.stdout);
      debugLog.debug('Tesseract and imagemagick found, continuing with OCR processing');

      // convert PDF to TIFF first
      await spawn('convert', ['-density', '300', this.filepath, '-depth', '8',
        '-strip', '-background', 'white', '-alpha', 'off', '/tmp/tmp.tiff']);
      // run OCR
      const res = await spawn('tesseract', ['/tmp/tmp.tiff', '-', '-c', 'debug_file=/dev/null', '-l', 'eng'], { capture: ['stdout', 'stderr'] });
      return result.stdout.split('\f').slice(0, -1);
    } catch (e) {
      if (e.errno === 'ENOENT') {
        debugLog.debug('Tesseract not found, skipping OCR processing');
      }
      return null;
    };

  }

  async extractText() {
    let pages = await this.attemptOcr();
    if (pages === null) {
      const result = await spawn('pdftotext', [this.filepath, '-'], { capture: ['stdout', 'stderr'] });
      pages = result.stdout.split('\f').slice(0, -1);
    }

    return {
      fullText: pages.reduce((memo, page, index) => ({ ...memo, [index + 1]: page.replace(/(\S+)(\s?)/g, `$1[[${index + 1}]]$2`) }), {}),
      totalPages: pages.length
    };
  }

  async createThumbnail(documentId) {
    let response;
    try {
      response = await spawn(
        'pdftoppm',
        ['-f', '1', '-singlefile', '-scale-to', '320', '-jpeg', this.filepath, this.getThumbnailPath(documentId)],
        { capture: ['stdout', 'stderr'] }
      );
    } catch (err) {
      response = err;
      errorLog.error(`Thumbnail creation error for: ${this.filepath}`);
    }

    return Promise.resolve(response);
  }

  deleteThumbnail(documentId) {
    return new Promise((resolve) => {
      fs.unlink(`${this.getThumbnailPath(documentId)}.jpg`, (err) => {
        if (err) { errorLog.error(`Thumbnail deletion error for: ${this.getThumbnailPath(documentId)}`); }
        resolve();
      });
    });
  }

  convert() {
    return this.extractText();
  }
}
