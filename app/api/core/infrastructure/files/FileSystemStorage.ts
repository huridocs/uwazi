/* eslint-disable no-restricted-imports */
import { createWriteStream } from 'fs';
import { access, mkdir, rm } from 'fs/promises';

import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import {
  FileWithContent,
  FileStorage,
  FileLocation,
} from '../../application/contracts/FileStorage.js';
import path from 'path';
import { pipeline } from 'stream/promises';
import { DiskFile } from './DiskFile.js';
import { FileContents } from '../../domain/files/FileContents.js';
import { StoredFile } from './StoredFile.js';
import { PathManager } from './PathManager.js';

export class FileSystemStorage implements FileStorage {
  private pathManager: PathManager;

  constructor(pathManager: PathManager) {
    this.pathManager = pathManager;
  }

  async storeContent(content: FileContents, location: FileLocation): Promise<void> {
    const filepath = this.pathManager.createPath(location);

    try {
      await mkdir(path.dirname(filepath), { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
    await pipeline(content.read(), createWriteStream(filepath));
  }

  async removeFile(file: FileWithContent) {
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

  async storeFile(file: FileWithContent) {
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

  getFile(input: FileLocation) {
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

  async getFiles(inputs: FileLocation[]): Promise<FileContents[]> {
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
