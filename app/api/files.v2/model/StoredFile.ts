import path from 'path';

export class StoredFile {
  readonly filename: string;

  readonly fullPath: string;

  readonly checksum?: string;

  constructor(fullPath: string, checksum?: string) {
    this.filename = path.basename(fullPath);
    this.fullPath = fullPath;
    this.checksum = checksum;
  }
}
