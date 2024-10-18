import { StoredFile } from '../model/StoredFile';
import { UwaziFile } from '../model/UwaziFile';

export interface FileStorage {
  list(): Promise<StoredFile[]>;
  getPath(file: UwaziFile): string;
}
