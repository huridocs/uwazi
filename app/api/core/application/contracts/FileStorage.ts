import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { FileContents } from '../../domain/files/FileContents.js';
import { FileType } from '../../domain/files/FileType.js';
import { StoredFile } from '../../infrastructure/files/StoredFile.js';

export type FileWithContent = BaseFile & { content: FileContents };

/** Where a stored file lives: the tenant's folder for its type, or a path under the documents folder. */
export type FileLocation = {
  type: FileType | 'customPath';
  filename: string;
  destination?: string;
};

export interface FileStorage {
  storeFile(file: FileWithContent): Promise<void>;
  removeFile(file: FileWithContent): Promise<void>;
  removeContent(path: string): Promise<void>;
  storeContent(content: FileContents, location: FileLocation): Promise<void>;
  list(): Promise<StoredFile[]>;
  getPath(file: BaseFile): string;
  getFiles(inputs: FileLocation[]): Promise<FileContents[]>;
  getFile(input: FileLocation): FileContents;
  fileExists(filePath: BaseFile): Promise<boolean>;
}
