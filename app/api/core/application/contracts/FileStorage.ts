import { FileContents } from '../../domain/files/FileContents';
import { FileType } from '../../domain/files/FileType';
import { StoredFile } from '../../domain/files/StoredFile';
import { UwaziFile, UwaziFileWithContents } from '../../domain/files/UwaziFile';

export type GetFileInput = {
  type: FileType | 'customPath';
  filename: string;
  destination?: string;
};

export interface FileStorage {
  storeFile(file: UwaziFileWithContents): Promise<void>;
  removeFile(file: UwaziFileWithContents): Promise<void>;
  storeContent(content: FileContents, subpath: string): Promise<void>;
  list(): Promise<StoredFile[]>;
  getPath(file: UwaziFile): string;
  getFiles(inputs: GetFileInput[]): Promise<FileContents[]>;
  getFile(input: GetFileInput): Promise<FileContents>;
  fileExists(filePath: UwaziFile): Promise<boolean>;
}
