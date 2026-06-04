import path from 'path';

export class StoredFile {
  readonly filename: string;

  readonly fullPath: string;

  readonly lastModified?: Date;

  readonly checksum?: string;

  constructor(fullPath: string, lastModified?: Date, checksum?: string) {
    this.filename = path.basename(fullPath);
    this.fullPath = fullPath;
    this.checksum = checksum;
    this.lastModified = lastModified;
  }
}
