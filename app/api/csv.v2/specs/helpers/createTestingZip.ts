import path from 'path';
import { ZipFile } from 'yazl';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs';

const createTestingZip = async (
  filesToZip: string[],
  fileName: string,
  directory: string
): Promise<void> =>
  new Promise((resolve, reject) => {
    const zipfile = new ZipFile();

    filesToZip.forEach(file => {
      zipfile.addFile(file, path.basename(file));
    });

    zipfile.end();
    zipfile.outputStream
      .pipe(fs.createWriteStream(path.join(directory, 'zipData', fileName)))
      .on('close', () => resolve())
      .on('error', reject);
  });

export { createTestingZip };
