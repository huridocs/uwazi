import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { FileWithContents } from '#api/core/domain/files/FileWithContents.js';
import { FileContents } from '../../domain/files/FileContents.js';
import { FileType } from '../../domain/files/FileType.js';
import { StoredFile } from '../../domain/files/StoredFile.js';

export type GetFileInput = {
  type: FileType | 'customPath';
  filename: string;
  destination?: string;
};

export interface FileStorage {
  storeFile(file: FileWithContents): Promise<void>;
  removeFile(file: FileWithContents): Promise<void>;
  removeContent(path: string): Promise<void>;
  storeContent(content: FileContents, subpath: string): Promise<void>;
  list(): Promise<StoredFile[]>;
  getPath(file: BaseFile): string;
  getFiles(inputs: GetFileInput[]): Promise<FileContents[]>;
  getFile(input: GetFileInput): FileContents;
  fileExists(filePath: BaseFile): Promise<boolean>;
}
