/* eslint-disable node/no-restricted-import */
import { createReadStream, createWriteStream } from 'fs';

import { pipeline } from 'stream/promises';
import { FileStorage, GetFileInput, UploadFileInput } from '../contracts/FileStorage';
import { File } from '../model/File';
import { StoredFile } from '../model/StoredFile';
import { UwaziFile } from '../model/UwaziFile';
import { PathManager } from './PathManager';

export class FileSystemStorage implements FileStorage {
  private pathManager: PathManager;

  constructor(pathManager: PathManager) {
    this.pathManager = pathManager;
  }

  async storeFile(input: UploadFileInput) {
    await pipeline(
      input.file.source,
      createWriteStream(
        this.pathManager.createPath({ filename: input.file.filename, type: input.type })
      )
    );
  }

  async getFile(input: GetFileInput): Promise<File> {
    const stream = createReadStream(this.pathManager.createPath(input));

    return new File({ filename: input.filename, source: stream });
  }

  async getFiles(inputs: GetFileInput[]): Promise<File[]> {
    const promises = inputs.map(async input => this.getFile(input));

    return Promise.all(promises);
  }

  async list(): Promise<StoredFile[]> {
    throw new Error('Method not implemented.');
  }

  getPath(_file: UwaziFile): string {
    throw new Error('Method not implemented.');
  }
}
