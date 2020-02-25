import path from 'path';
import yazl from 'yazl';
import fs from 'fs';
import { Readable } from 'stream';

import asyncFs from 'api/utils/async-fs';

import configPaths from '../../config/paths';

const createTestingZip = (filesToZip, fileName, directory = __dirname) =>
  new Promise((resolve, reject) => {
    const zipfile = new yazl.ZipFile();

    filesToZip.forEach(file => {
      zipfile.addFile(file, path.basename(file));
    });

    zipfile.end();
    zipfile.outputStream
      .pipe(fs.createWriteStream(path.join(directory, `/zipData/${fileName}`)))
      .on('close', resolve)
      .on('error', reject);
  });

const fileExists = async fileName =>
  asyncFs.exists(path.join(configPaths.uploadedDocuments, fileName));

const stream = string =>
  new Readable({
    read() {
      this.push(string);
      this.push(null);
    },
  });

export { stream, createTestingZip, fileExists };
