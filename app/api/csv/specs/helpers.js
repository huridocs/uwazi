import path from 'path';
import yazl from 'yazl';
import fs from 'fs';

import async_fs from 'api/utils/async-fs';

import configPaths from '../../config/paths';

const createTestingZip = (filesToZip, fileName) =>
  new Promise((resolve, reject) => {
    const zipfile = new yazl.ZipFile();

    filesToZip.forEach((file) => {
      zipfile.addFile(file, path.basename(file));
    });

    zipfile.end();
    zipfile.outputStream
    .pipe(fs.createWriteStream(path.join(__dirname, `/zipData/${fileName}`)))
    .on('close', resolve)
    .on('error', reject);
  });

const fileExists = async fileName =>
  async_fs.exists(path.join(configPaths.uploadDocumentsPath, fileName));

export {
  createTestingZip,
  fileExists
};
