// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import * as os from 'os';
import { legacyLogger } from 'api/log';
import { createError } from 'api/utils';
import { spawn } from 'child-process-promise';
import EventEmitter from 'events';
import path from 'path';
import { detectLanguage } from 'shared/detectLanguage';
import { FileType } from 'shared/types/fileType';
import { storage } from './storage';

class PDF extends EventEmitter {
  private file: FileType & { destination?: string };

  private filepath: string;

  constructor(file: FileType & { destination?: string }) {
    super();
    this.file = file;
    this.filepath = path.join(file.destination || '', file.filename || '');
  }

  async extractText() {
    try {
      const result = await spawn('pdftotext', [this.filepath, '-'], {
        capture: ['stdout', 'stderr'],
      });
      const pages = result.stdout.split('\f').slice(0, -1);
      return {
        fullText: pages.reduce<{ [k: string]: string }>(
          (memo, page, index) => ({
            ...memo,
            [index + 1]: page.replace(/(\S+)(\s?)/g, `$1[[${index + 1}]]$2`),
          }),
          {}
        ),
        fullTextWithoutPages: pages.reduce<{ [k: string]: string }>(
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

  async createThumbnail(documentId: string) {
    const thumbnailPath = path.join(os.tmpdir(), `${documentId}.jpg`);
    let response;
    try {
      await spawn(
        'pdftoppm',
        [
          '-f',
          '1',
          '-singlefile',
          '-scale-to',
          '320',
          '-jpeg',
          this.filepath,
          path.join(os.tmpdir(), documentId),
        ],
        { capture: ['stdout', 'stderr'] }
      );
      response = `${documentId}.jpg`;
      await storage.storeFile(response, createReadStream(thumbnailPath), 'thumbnail');
    } catch (err) {
      response = err;
      legacyLogger.error(err.stderr);
    }

    return Promise.resolve(response);
  }

  async convert() {
    return this.extractText().then(conversion => ({
      ...conversion,
      ...this.file,
      language:
        detectLanguage(Object.values(conversion.fullTextWithoutPages).join(''), 'franc') ||
        undefined,
      processed: true,
      toc: [],
    }));
  }
}

export { PDF };
