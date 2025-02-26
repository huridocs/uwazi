/* eslint-disable node/no-restricted-import */
import { createReadStream } from 'fs';

import { PathManager } from './PathManager';
import { FileStorage, GetFileInput } from '../contracts/FileStorage';
import { StoredFile } from '../model/StoredFile';
import { UwaziFile } from '../model/UwaziFile';
import { File } from '../model/File';

export class FileSystemStorage implements FileStorage {
  private pathManager: PathManager;

  constructor(pathManager: PathManager) {
    this.pathManager = pathManager;
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

  getPath(file: UwaziFile): string {
    throw new Error('Method not implemented.');
  }
}
