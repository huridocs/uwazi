import path from 'path';
import yazl from 'yazl';
import { Readable } from 'stream';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs';

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

class ReadableString extends Readable {
  constructor(input) {
    super();
    this.input = input;
  }

  freshCopy() {
    return new ReadableString(this.input);
  }

  _read() {
    this.push(this.input);
    this.push(null);
  }
}

const stream = string => new ReadableString(string);

const mockCsvFileReadStream = str =>
  jest.spyOn(fs, 'createReadStream').mockImplementation(() => stream(str));

export { stream, createTestingZip, mockCsvFileReadStream };
