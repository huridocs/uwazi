import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import languages from 'shared/languages';
import { spawn } from 'child-process-promise';
import errorLog from 'api/log/errorLog';
import { createError } from 'api/utils';

export default class PDF extends EventEmitter {
  constructor(file) {
    super();
    this.file = file;
    this.filepath = path.join(file.destination || '', file.filename || '');
  }

  getThumbnailPath(documentId) {
    return path.join(path.dirname(this.filepath), documentId);
  }

  async extractText() {
    try {
      const result = await spawn('pdftotext', [this.filepath, '-'], {
        capture: ['stdout', 'stderr'],
      });
      const pages = result.stdout.split('\f').slice(0, -1);
      return {
        fullText: pages.reduce(
          (memo, page, index) => ({
            ...memo,
            [index + 1]: page.replace(/(\S+)(\s?)/g, `$1[[${index + 1}]]$2`),
          }),
          {}
        ),
        fullTextWithoutPages: pages.reduce(
          (memo, page, index) => ({
            ...memo,
            [index + 1]: page,
          }),
          {}
        ),
        totalPages: pages.length,
      };
    } catch (e) {
      if (e.name === 'ChildProcessError') {
        throw createError(`${e.message}\nstderr output:\n${e.stderr}`);
      }
      throw createError(e.message);
    }
  }

  async createThumbnail(documentId) {
    let response;
    try {
      response = await spawn(
        'pdftoppm',
        [
          '-f',
          '1',
          '-singlefile',
          '-scale-to',
          '320',
          '-jpeg',
          this.filepath,
          this.getThumbnailPath(documentId),
        ],
        { capture: ['stdout', 'stderr'] }
      );
    } catch (err) {
      response = err;
      errorLog.error(`Thumbnail creation error for: ${this.filepath}`);
    }

    return Promise.resolve(response);
  }

  deleteThumbnail(documentId) {
    return new Promise(resolve => {
      fs.unlink(`${this.getThumbnailPath(documentId)}.jpg`, err => {
        if (err) {
          errorLog.error(`Thumbnail deletion error for: ${this.getThumbnailPath(documentId)}`);
        }
        resolve();
      });
    });
  }

  generateFileInfo(conversion) {
    return {
      ...this.file,
      language: languages.detect(Object.values(conversion.fullTextWithoutPages).join(''), 'franc'),
    };
  }

  convert() {
    return this.extractText().then(conversion => ({
      ...conversion,
      file: this.generateFileInfo(conversion),
      processed: true,
      toc: [],
    }));
  }
}
