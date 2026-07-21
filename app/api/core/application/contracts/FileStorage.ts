import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { FileContents } from '../../domain/files/FileContents.js';
import { FileType } from '../../domain/files/FileType.js';
import { StoredFile } from '../../infrastructure/files/StoredFile.js';

export type FileWithContent = BaseFile & { content: FileContents };

export type GetFileInput = {
  type: FileType | 'customPath';
  filename: string;
  destination?: string;
};

export interface FileStorage {
  storeFile(file: FileWithContent): Promise<void>;
  removeFile(file: FileWithContent): Promise<void>;
  removeContent(path: string): Promise<void>;
  storeContent(content: FileContents, subpath: string): Promise<void>;
  list(): Promise<StoredFile[]>;
  getPath(file: BaseFile): string;
  getFiles(inputs: GetFileInput[]): Promise<FileContents[]>;
  getFile(input: GetFileInput): FileContents;
  fileExists(filePath: BaseFile): Promise<boolean>;
}
