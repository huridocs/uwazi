import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

import { generateFileName, fileFromReadStream } from 'api/files/filesystem';
import { createError } from 'api/utils';
import zipFile from 'api/utils/zipFile';

import configPaths from '../config/paths';

const extractFromZip = async (filePath: string, fileName: string) => {
  const readStream = await zipFile(filePath).findReadStream(entry => entry === fileName);

  if (!readStream) {
    throw createError(`${fileName} file not found`);
  }

  return readStream;
};

export class ImportFile {
  filePath: string | Readable;

  constructor(filePath: string | Readable) {
    this.filePath = filePath;
  }

  async readStream(fileName = 'import.csv') {
    if (this.filePath instanceof Readable) {
      return this.filePath;
    }
    if (path.extname(this.filePath) === '.zip') {
      return extractFromZip(this.filePath, fileName);
    }
    return fs.createReadStream(this.filePath);
  }

  async extractFile(fileName: string) {
    const generatedName = generateFileName({ originalname: fileName });

    await fileFromReadStream(generatedName, await this.readStream(fileName));

    return {
      destination: configPaths.uploadedDocuments,
      originalname: fileName,
      filename: generatedName,
    };
  }
}

const importFile = (filePath: string | Readable) => new ImportFile(filePath);

export default importFile;
