type StorageType = 'local' | 's3';

export class FileNotFound extends Error {
  filename: string;

  storage: StorageType;

  constructor(filename: string, storage: StorageType) {
    super(`File ${filename} not found in ${storage} storage`);
    this.filename = filename;
    this.storage = storage;
  }
}
