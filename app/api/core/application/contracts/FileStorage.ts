import { BaseFile } from 'api/core/domain/files/BaseFile';
import { FileWithContents } from 'api/core/domain/files/FileWithContents';
import { FileContents } from '../../domain/files/FileContents';
import { FileType } from '../../domain/files/FileType';
import { StoredFile } from '../../domain/files/StoredFile';

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
