// eslint-disable-next-line node/no-restricted-import
import { createReadStream, ReadStream } from 'fs';

import path from 'path';
import { FileContents } from '../../domain/files/FileContents';

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
    let fileStream: ReadStream | undefined;

    const cleanup = () => {
      if (fileStream && !fileStream.destroyed) {
        fileStream.destroy();
      }
    };

    return new FileContents(async function* streamCallback() {
      try {
        fileStream = createReadStream(filepath);
        for await (const chunk of fileStream) yield chunk;
      } finally {
        cleanup();
      }
    }, cleanup);
  }
}
