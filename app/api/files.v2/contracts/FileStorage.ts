import { StoredFile } from '../model/StoredFile';
import { UwaziFile } from '../model/UwaziFile';
import { FileType } from '../model/FileType';
import { FileContents } from '../model/FileContents';

export type GetFileInput = {
  type: FileType | 'customPath';
  filename: string;
  destination?: string;
};

export type UploadFileInput = {
  file: FileContents;
  type: FileType | 'customPath';
  destination?: string;
};

export interface FileStorage {
  storeFile(input: UploadFileInput): Promise<void>;
  list(): Promise<StoredFile[]>;
  getPath(file: UwaziFile): string;
  getFiles(inputs: GetFileInput[]): Promise<FileContents[]>;
  getFile(input: GetFileInput): Promise<FileContents>;
}
