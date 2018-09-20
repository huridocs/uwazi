import EventEmitter from 'events';
import path from 'path';
import fs from 'fs';
import debugLog from 'api/log/debugLog';
import { spawn } from 'child-process-promise';

const basename = (filepath = '') => {
  let finalPath = filepath;
  if (typeof filepath !== 'string') {
    finalPath = '';
  }
  return path.basename(finalPath, path.extname(finalPath));
};

const renameThumbnail = (dir, documentId) => new Promise((resolve, reject) => {
  fs.readdir(dir, (readErr, files) => {
    if (readErr) { reject(readErr); }
    const searchExpression = new RegExp(`${documentId}-(.*).jpg`, 'g');
    const numberedFileName = files.find(e => e.match(searchExpression));
    fs.rename(path.join(dir, numberedFileName), path.join(dir, `${documentId}.jpg`), (renameErr) => {
      if (renameErr) { reject(renameErr); }
      resolve();
    });
  });
});

export default class PDF extends EventEmitter {
  constructor(filepath, originalName) {
    super();
    this.logFile = `${__dirname}/../../../log/${basename(originalName)}.log`;
    this.filepath = filepath;
    this.optimizedPath = filepath;
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
    const dir = path.dirname(this.filepath);
    let response;
    try {
      response = await spawn(
        'pdftoppm',
        ['-f', '1', '-l', '1', '-scale-to', '320', '-jpeg', this.filepath, path.join(dir, documentId)],
        { capture: ['stdout', 'stderr'] }
      );
    } catch (err) {
      debugLog.debug(`Thumbnail creation error for: ${this.filepath}`);
    }

    return renameThumbnail(dir, documentId)
    .then(() => response)
    .catch(err => err);
  }

  convert() {
    return this.extractText();
  }
}
