/* eslint-disable class-methods-use-this */
// eslint-disable-next-line node/no-restricted-import
import { stat } from 'fs/promises';
// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';

import { Result } from 'api/core/libs/Result';
import { generateFileName } from 'api/files';
import { DiskFile } from 'api/files.v2/model/DiskFile';
import { FileContents } from 'api/files.v2/model/FileContents';
import { tmpdir } from 'os';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export class FileContentsIO {
  async size(file: DiskFile) {
    try {
      return Result.ok((await stat(file.path)).size);
    } catch (e) {
      return Result.fail(e);
    }
  }

  async toDisk(file: FileContents) {
    const tmpFilePath = path.join(tmpdir(), generateFileName({}));
    await pipeline(Readable.from(file.read()), createWriteStream(tmpFilePath));
    return new DiskFile(tmpFilePath);
  }

  // check if it can be not used (in favor of asyncIterable read)
  async toBuffer(content: FileContents) {
    try {
      const iterable = content.read();
      const chunks: Buffer[] = [];
      for await (const chunk of iterable) {
        chunks.push(Buffer.from(chunk));
      }
      return Result.ok(Buffer.concat(chunks));
    } catch (e) {
      return Result.fail(e);
    }
  }

  async asContentString(file: FileContents) {
    const buffer = await this.toBuffer(file);
    if (buffer.isError()) {
      return buffer;
    }
    return Result.ok(buffer.getData().toString('utf8'));
  }
}
