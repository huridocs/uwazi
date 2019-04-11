import fs from 'fs';
import path from 'path';
import { generateFileName } from 'api/utils/files';

import zipFile from './zipFile';
import { uploadDocumentsPath } from '../config/paths';

const ImportFile = filePath => ({
  async readStream(fileName) {
    if (path.extname(filePath) === '.zip') {
      return zipFile(filePath).findReadStream(
        (entry) => {
          if (fileName) {
            return fileName === entry.fileName;
          }

          return path.extname(entry.fileName) === '.csv';
        }
      );
    }
    return fs.createReadStream(filePath);
  },

  async extractFile(fileName) {
    const generatedName = generateFileName({ originalname: fileName });
    const fileStream = await this.readStream(fileName);

    await new Promise((resolve, reject) => {
      fileStream
      .pipe(fs.createWriteStream(path.join(uploadDocumentsPath, `/${generatedName}`)))
      .on('close', resolve)
      .on('error', reject);
    });

    return generatedName;
  }
});

export default ImportFile;
