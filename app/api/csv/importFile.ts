import path from 'path';

import { generateFileName, fileFromReadStream } from 'api/files/filesystem';
import { createError } from 'api/utils';
import zipFile from 'api/utils/zipFile';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { readFile } from 'fs/promises';

const extractFromZip = async (zipPath: string, fileName: string) => {
  const readStream = await zipFile(zipPath).findReadStream(entry => entry === fileName);

  if (!readStream) {
    throw createError(`${fileName} file not found`);
  }

  return readStream;
};

class ImportFile {
  filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  private async checkFileExists() {
    await readFile(this.filePath);
  }

  async readStream(fileName = 'import.csv') {
    await this.checkFileExists();
    if (path.extname(this.filePath) === '.zip') {
      return extractFromZip(this.filePath, fileName);
    }
    return createReadStream(this.filePath);
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

export { ImportFile };
export default importFile;
