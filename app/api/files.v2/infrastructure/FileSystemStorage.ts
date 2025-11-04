/* eslint-disable node/no-restricted-import */
import { createWriteStream } from 'fs';

import { pipeline } from 'stream/promises';
import { FileStorage, GetFileInput, UploadFileInput } from '../contracts/FileStorage';
import { FileContents } from '../model/FileContents';
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
      (await input.file.getReadable()).getDataOrThrow(),
      createWriteStream(
        this.pathManager.createPath({ filename: input.file.filename, type: input.type })
      )
    );
  }

  async getFile(input: GetFileInput): Promise<FileContents> {
    return new FileContents(this.pathManager.createPath(input));
  }

  async getFiles(inputs: GetFileInput[]): Promise<FileContents[]> {
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
