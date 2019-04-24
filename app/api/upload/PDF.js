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
      // check that ocrmypdf exists system-wide
      const res1 = await spawn('ocrmypdf', ['--version'], { capture: ['stdout', 'stderr'] });
      debugLog.debug(res1.stdout);
      debugLog.debug('ocrmypdf found, continuing with OCR processing');

      // run OCR and add the text layer in place on the existing PDF file path
      const _res = await spawn('ocrmypdf', ['-l', 'eng', this.filepath, this.filepath], { capture: ['stdout', 'stderr'] });
    } catch (e) {
      if (e.errno === 'ENOENT') {
        debugLog.debug('ocrmypdf not found, skipping OCR processing');
      }
    };
  }

  async extractText() {
    await this.attemptOcr();
    const result = await spawn('pdftotext', [this.filepath, '-'], { capture: ['stdout', 'stderr'] });
    const pages = result.stdout.split('\f').slice(0, -1);

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
