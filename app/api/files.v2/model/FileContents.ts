// eslint-disable-next-line node/no-restricted-import
import { createReadStream, createWriteStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { readFile, stat } from 'fs/promises';

import { Result } from 'api/core/libs/Result';
import { generateFileName } from 'api/files/filesystem';
import { tmpdir } from 'os';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { FileContentError } from './errors';

export type ReadableCallback = () => Promise<Readable>;

export interface FileContentsCallbackOptions {
  filename: string;
  readableCallback: ReadableCallback;
}

export class FileContents {
  filename: string;

  private filepath?: string;

  private readableCallback?: ReadableCallback;

  constructor(filePath: string | FileContentsCallbackOptions) {
    if (typeof filePath === 'string') {
      this.filepath = filePath;
      this.filename = path.basename(filePath);
    } else {
      this.filename = filePath.filename;
      this.readableCallback = filePath.readableCallback;
    }
  }

  async size() {
    if (this.filepath) {
      return Result.ok((await stat(this.filepath)).size);
    }

    return Result.fail(
      new FileContentError(
        'size method only available if FileContents was instantiated with a disk filepath'
      )
    );
  }

  async toDisk() {
    if (this.filepath) {
      return this;
    }
    const tmpFilePath = path.join(tmpdir(), generateFileName({ originalname: this.filename }));
    await pipeline((await this.getReadable()).getDataOrThrow(), createWriteStream(tmpFilePath));
    return new FileContents(tmpFilePath);
  }

  async getReadable() {
    if (this.readableCallback) {
      return Result.ok(await this.readableCallback());
    }

    if (!this.filepath) {
      return Result.fail(new FileContentError('No file path or readable callback provided'));
    }

    return Result.ok(createReadStream(this.filepath));
  }

  async toBuffer() {
    if (this.readableCallback) {
      const readable = await this.readableCallback();
      return Result.ok(await this.streamToBuffer(readable));
    }

    if (!this.filepath) {
      return Result.fail(new FileContentError('No file path or readable callback provided'));
    }
    return Result.ok(await readFile(this.filepath));
  }

  async asContentString() {
    const buffer = await this.toBuffer();
    if (buffer.isOk()) {
      return Result.ok(buffer.getData().toString('utf8'));
    }
    return buffer;
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

  // eslint-disable-next-line class-methods-use-this
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', chunk => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on('error', reject);
    });
  }

  static fromPath(paths: string[]) {
    return new FileContents(path.join(...paths));
  }
}
