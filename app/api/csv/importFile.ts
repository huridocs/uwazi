import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

import { generateFileName, fileFromReadStream, uploadsPath } from 'api/files/filesystem';
import { createError } from 'api/utils';
import zipFile from 'api/utils/zipFile';

const extractFromZip = async (zipPath: string, fileName: string) => {
  const readStream = await zipFile(zipPath).findReadStream(entry => entry === fileName);

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

  async extractFile(fileName: string, destination: string | undefined = undefined) {
    const generatedName = generateFileName({ originalname: fileName });

    await fileFromReadStream(generatedName, await this.readStream(fileName), destination);

    return {
      destination: destination || uploadsPath(),
      originalname: fileName,
      filename: generatedName,
    };
  }
}

const importFile = (filePath: string | Readable) => new ImportFile(filePath);

export default importFile;
