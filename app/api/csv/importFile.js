import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

import { generateFileName, fileFromReadStream } from 'api/files/filesystem';
import { createError } from 'api/utils';
import zipFile from 'api/utils/zipFile';

import configPaths from '../config/paths';

const extractFromZip = async (filePath, fileName) => {
  const readStream = await zipFile(filePath).findReadStream(entry => entry.fileName === fileName);

  if (!readStream) {
    throw createError(`${fileName} file not found`);
  }

  return readStream;
};

const importFile = filePath => ({
  async readStream(fileName = 'import.csv') {
    if (filePath instanceof Readable) {
      return filePath;
    }
    if (path.extname(filePath) === '.zip') {
      return extractFromZip(filePath, fileName);
    }
    return fs.createReadStream(filePath);
  },

  async extractFile(fileName) {
    const generatedName = generateFileName({ originalname: fileName });

    await fileFromReadStream(generatedName, await this.readStream(fileName));

    return {
      destination: configPaths.uploadedDocuments,
      originalname: fileName,
      filename: generatedName,
    };
  },
});

export default importFile;
