import path from 'path';

import {
  generateFileName,
  fileFromReadStream,
  getMimetypeFromOriginalName,
} from 'api/files/filesystem';
import zipFile from 'api/utils/zipFile';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { readFile, stat } from 'fs/promises';

const extractFromZip = async (zipPath: string, fileName: string) => {
  const readStream = await zipFile(zipPath).findReadStream(entry => entry === fileName);

  if (!readStream) {
    throw new Error(`CSV import,  ${fileName} file not found on the zip file`);
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

  async extractFile(fileName: string, existingGeneratedName?: string) {
    const generatedName = existingGeneratedName || generateFileName({ originalname: fileName });
    const mimetype = getMimetypeFromOriginalName(fileName) || 'application/octet-stream';

    await fileFromReadStream(generatedName, await this.readStream(fileName), '/tmp');
    const tmpPath = `/tmp/${generatedName}`;

    return {
      destination: '/tmp',
      path: tmpPath,
      originalname: fileName,
      filename: generatedName,
      mimetype,
      size: (await stat(tmpPath)).size,
    };
  }
}

const importFile = (filePath: string) => new ImportFile(filePath);

export { ImportFile };
export default importFile;
