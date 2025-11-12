// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import

import { Result } from 'api/core/libs/Result';
import path from 'path';
import { FileContentError } from './errors';

export type StreamCallback = () => AsyncIterable<Uint8Array>;

export interface FileContentsCallbackOptions {
  filename: string;
  streamCallback: StreamCallback;
}

export class FileContents {
  filename: string;

  private filepath?: string;

  private streamCallback?: StreamCallback;

  constructor(filePath: string | FileContentsCallbackOptions) {
    if (typeof filePath === 'string') {
      this.filepath = filePath;
      this.filename = path.basename(filePath);
    } else {
      this.filename = filePath.filename;
      this.streamCallback = filePath.streamCallback;
    }
  }

  async *read(): AsyncIterable<Uint8Array> {
    if (this.streamCallback) {
      for await (const chunk of this.streamCallback()) {
        yield chunk;
      }
    }

    if (this.filepath) {
      const stream = createReadStream(this.filepath);
      for await (const chunk of stream) yield chunk;
    }
  }

  getFullPath() {
    if (!this.filepath) {
      return Result.fail(
        new FileContentError(
          'File was probably initialized with a readable callback instead of fullpath'
        )
      );
    }
    return Result.ok(this.filepath);
  }

  static fromPath(paths: string[]) {
    return new FileContents(path.join(...paths));
  }
}
