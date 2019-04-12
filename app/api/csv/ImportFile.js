import fs from 'fs';
import path from 'path';
import zipFile from './zipFile';

export default class ImportFile {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async readStream(fileName) {
    if (path.extname(this.filePath) === '.zip') {
      return zipFile(this.filePath).findReadStream(
        (entry) => {
          if (fileName) {
            return fileName === entry.fileName;
          }

          return path.extname(entry.fileName) === '.csv';
        }
      );
    }
    return fs.createReadStream(this.filePath);
  }
}
