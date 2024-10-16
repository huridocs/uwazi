export class StoredFile {
  readonly filename: string;

  readonly checksum?: string;

  constructor(filename: string, checksum?: string) {
    this.filename = filename;
    this.checksum = checksum;
  }
}
