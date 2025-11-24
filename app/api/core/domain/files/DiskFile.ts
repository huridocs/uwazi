// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';

import path from 'path';
import { FileContents } from './FileContents';

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
    return new FileContents(async function* streamCallback() {
      const stream = createReadStream(filepath);
      for await (const chunk of stream) yield chunk;
    });
  }
}
