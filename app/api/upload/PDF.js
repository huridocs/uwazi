import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child-process-promise';
import errorLog from 'api/log/errorLog';

export default class PDF extends EventEmitter {
  constructor(filepath) {
    super();
    this.filepath = filepath;
    this.optimizedPath = filepath;
  }

  getThumbnailPath(documentId) {
    return path.join(path.dirname(this.filepath), documentId);
  }

  async extractText() {
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
