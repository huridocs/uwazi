/* eslint-disable node/no-restricted-import */
import { createWriteStream } from 'fs';
import { access, mkdir, rm } from 'fs/promises';

import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { FileWithContents } from '#api/core/domain/files/FileWithContents.js';
import path from 'path';
import { pipeline } from 'stream/promises';
import { FileStorage, GetFileInput } from '../../application/contracts/FileStorage.js';
import { DiskFile } from './DiskFile.js';
import { FileContents } from '../../domain/files/FileContents.js';
import { StoredFile } from '../../domain/files/StoredFile.js';
import { PathManager } from './PathManager.js';

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

  async removeFile(file: FileWithContents) {
    try {
      await rm(this.pathManager.createPath(file));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /* eslint-disable-next-line class-methods-use-this */
  async removeContent(filePath: string) {
    try {
      await rm(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async storeFile(file: FileWithContents) {
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

  getFile(input: GetFileInput) {
    return new DiskFile(this.pathManager.createPath(input)).toContent();
  }

  async fileExists(file: BaseFile) {
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

  getPath(_file: BaseFile): string {
    throw new Error('Method not implemented.');
  }
}
