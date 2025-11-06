// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { stat } from 'fs/promises';
import * as os from 'os';
import { legacyLogger } from 'api/log';
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
        throw new Error(`${e.message}\nstderr output:\n${e.stderr}`);
      }
      throw e;
    }
  }

  async createThumbnail(documentId: string) {
    const thumbnailPath = path.join(os.tmpdir(), `${documentId}.jpg`);
    let filename;
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
      filename = `${documentId}.jpg`;
      await storage.storeFile(filename, createReadStream(thumbnailPath), 'thumbnail');
    } catch (err) {
      legacyLogger.error(err.stderr);
      return err;
    }

    return Promise.resolve({
      filename,
      size: (await stat(path.join(os.tmpdir(), filename))).size,
    });
  }

  async convert() {
    return this.extractText().then(conversion => ({
      ...conversion,
      ...this.file,
      language:
        detectLanguage(Object.values(conversion.fullTextWithoutPages).join(''), 'ISO639_3') ||
        undefined,
      processed: true,
      toc: [],
    }));
  }
}

export { PDF };
