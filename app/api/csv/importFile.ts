import { fs, storeFile } from 'api/files';
import path from 'path';

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
  filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async readStream(fileName = 'import.csv') {
    if (path.extname(this.filePath) === '.zip') {
      return extractFromZip(this.filePath, fileName);
    }
    return fs.createReadStream(this.filePath);
  }

  async extractFile(fileName: string) {
    const generatedName = generateFileName({ originalname: fileName });

    await fileFromReadStream(generatedName, await this.readStream(fileName), '/tmp');

    return {
      destination: '/tmp',
      path: `/tmp/${generatedName}`,
      originalname: fileName,
      filename: generatedName,
    };
  }
}

const importFile = (filePath: string) => new ImportFile(filePath);

export default importFile;
