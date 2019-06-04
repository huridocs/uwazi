import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

import { generateFileName } from 'api/utils/files';
import zipFile from 'api/utils/zipFile';

import configPaths from '../config/paths';

const createFile = async (fileStream, fileName) =>
  new Promise((resolve, reject) => {
    fileStream
    .pipe(fs.createWriteStream(path.join(configPaths.uploadDocumentsPath, `/${fileName}`)))
    .on('close', resolve)
    .on('error', reject);
  });

const csvOrFileName = fileName =>
  (entry) => {
    if (fileName) {
      return fileName === entry.fileName;
    }

    return path.extname(entry.fileName) === '.csv';
  };

const importFile = filePath => ({
  async readStream(fileName) {
    if (filePath instanceof Readable) {
      return filePath;
    }
    if (path.extname(filePath) === '.zip') {
      return zipFile(filePath)
      .findReadStream(csvOrFileName(fileName));
    }
    return fs.createReadStream(filePath);
  },

  async extractFile(fileName) {
    const generatedName = generateFileName({ originalname: fileName });

    await createFile(await this.readStream(fileName), generatedName);

    return {
      destination: configPaths.uploadDocumentsPath,
      originalname: fileName,
      filename: generatedName,
    };
  }
});

export default importFile;
