/* eslint-disable class-methods-use-this */
// eslint-disable-next-line node/no-restricted-import
import { stat } from 'fs/promises';
// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';

import { Result } from 'api/core/libs/Result';
import { generateFileName } from 'api/files';
import { FileContentError } from 'api/files.v2/model/errors';
import { FileContents } from 'api/files.v2/model/FileContents';
import { tmpdir } from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

export class FileContentsIO {
  async size(file: FileContents) {
    const filePath = file.getFullPath().getDataOrThrow();
    if (filePath) {
      return Result.ok((await stat(filePath)).size);
    }

    return Result.fail(
      new FileContentError(
        'size method only available if FileContents was instantiated with a disk filepath'
      )
    );
  }

  async toDisk(file: FileContents) {
    const filePath = file.getFullPath();
    if (filePath.isOk()) {
      return file;
    }
    const tmpFilePath = path.join(tmpdir(), generateFileName({ originalname: file.filename }));
    await pipeline(Readable.from(file.read()), createWriteStream(tmpFilePath));
    return new FileContents(tmpFilePath);
  }

  // check if it can be not used (in favor of asyncIterable read)
  async toBuffer(file: FileContents) {
    try {
      const iterable = file.read();
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
