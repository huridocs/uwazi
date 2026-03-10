// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';

import path from 'path';
import { FileContents } from '../../domain/files/FileContents.js';

export class DiskFile {
  private filepath: string;

  constructor(filePath: string) {
    this.filepath = filePath;
  }

  get filename() {
    return path.basename(this.filepath);
  }

  get path() {
    return this.filepath;
  }

  toContent() {
    const filepath = this.path;

    const fileContents = new FileContents(async function* streamCallback() {
      const stream = createReadStream(filepath);

      yield* stream;
    });

    return fileContents;
  }
}
