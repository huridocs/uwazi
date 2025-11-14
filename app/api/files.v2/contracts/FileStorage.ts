import { FileContents } from '../model/FileContents';
import { FileType } from '../model/FileType';
import { StoredFile } from '../model/StoredFile';
import { UwaziFile } from '../model/UwaziFile';

export type GetFileInput = {
  type: FileType | 'customPath';
  filename: string;
  destination?: string;
};

export interface FileStorage {
  storeFile(input: UwaziFile): Promise<void>;
  storeContent(content: FileContents, subpath: string): Promise<void>;
  list(): Promise<StoredFile[]>;
  getPath(file: UwaziFile): string;
  getFiles(inputs: GetFileInput[]): Promise<FileContents[]>;
  getFile(input: GetFileInput): Promise<FileContents>;
}
