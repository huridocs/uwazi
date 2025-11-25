/* eslint-disable node/no-restricted-import */
import { createWriteStream } from 'fs';
import { access, mkdir } from 'fs/promises';

import path from 'path';
import { pipeline } from 'stream/promises';
import { FileStorage, GetFileInput } from '../../application/contracts/FileStorage';
import { DiskFile } from '../../domain/files/DiskFile';
import { FileContents } from '../../domain/files/FileContents';
import { StoredFile } from '../../domain/files/StoredFile';
import { UwaziFile } from '../../domain/files/UwaziFile';
import { PathManager } from './PathManager';

export class FileSystemStorage implements FileStorage {
  private pathManager: PathManager;

  constructor(pathManager: PathManager) {
    this.pathManager = pathManager;
  }

  async storeContent(content: FileContents, subpath: string): Promise<void> {
    const filepath = this.pathManager.createPath({
      filename: path.basename(subpath),
      destination: path.dirname(subpath),
      type: 'customPath',
    });

    try {
      await mkdir(path.dirname(filepath), { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
    await pipeline(content.read(), createWriteStream(filepath));
  }

  async storeFile(file: UwaziFile) {
    const filepath = this.pathManager.createPath(file);

    try {
      await mkdir(path.dirname(filepath), { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    await pipeline(file.content.read(), createWriteStream(filepath));
  }

  async getFile(input: GetFileInput): Promise<FileContents> {
    return new DiskFile(this.pathManager.createPath(input)).toContent();
  }

  async fileExists(file: UwaziFile) {
    try {
      await access(this.pathManager.createPath(file));
    } catch (e) {
      if (e.code === 'ENOENT') {
        return false;
      }
      throw e;
    }
    return true;
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
