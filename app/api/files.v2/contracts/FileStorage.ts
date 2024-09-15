import { UwaziFile } from '../model/UwaziFile';

export interface FileStorage {
  list(): Promise<string[]>;
  getPath(file: UwaziFile): string;
}
