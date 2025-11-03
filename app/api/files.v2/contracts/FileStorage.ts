import { StoredFile } from '../model/StoredFile';
import { UwaziFile } from '../model/UwaziFile';
import { FileType } from '../model/FileType';
import { File } from '../model/File';

export type GetFileInput = {
  type: FileType;
  filename: string;
};

export type UploadFileInput = {
  file: File;
  type: FileType;
};

export interface FileStorage {
  storeFile(input: UploadFileInput): Promise<void>;
  list(): Promise<StoredFile[]>;
  getPath(file: UwaziFile): string;
  getFiles(inputs: GetFileInput[]): Promise<File[]>;
  getFile(input: GetFileInput): Promise<File>;
}
