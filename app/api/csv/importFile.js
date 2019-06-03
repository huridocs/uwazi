import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

import { generateFileName, fileFromReadStream } from 'api/utils/files';
import zipFile from 'api/utils/zipFile';

import configPaths from '../config/paths';

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

    await fileFromReadStream(generatedName, await this.readStream(fileName));

    return {
      destination: configPaths.uploadDocumentsPath,
      originalname: fileName,
      filename: generatedName,
    };
  }
});

export default importFile;
