import { FileContents } from '../../../files.v2/model/FileContents';
import { FileType } from '../../../files.v2/model/FileType';
import { StoredFile } from '../../../files.v2/model/StoredFile';
import { UwaziFile } from '../../../files.v2/model/UwaziFile';

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
  fileExists(filePath: UwaziFile): Promise<boolean>;
}
