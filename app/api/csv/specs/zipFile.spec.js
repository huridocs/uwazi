import path from 'path';
import yazl from 'yazl';
import fs from 'fs';
import zipFile from '../zipFile';

describe('ImportFile', () => {
  beforeAll((done) => {
    const zipfile = new yazl.ZipFile();
    zipfile.addFile(path.join(__dirname, '/zipData/test.csv'), 'test.csv');
    zipfile.end();
    zipfile
    .outputStream
    .pipe(fs.createWriteStream(path.join(__dirname, '/zipData/zipTest.zip')))
    .on('close', done)
    .on('error', (e) => {
      done.fail(e);
    });
  });

  afterAll(() => {
    fs.unlinkSync(path.join(__dirname, '/zipData/zipTest.zip'));
    fs.unlinkSync(path.join(__dirname, '/invalid_zip.zip'));
  });

  describe('findReadStream', () => {
    it('should return a readable stream for matched file', async (done) => {
      let fileContents;
      (
        await zipFile(path.join(__dirname, '/zipData/zipTest.zip'))
        .findReadStream(entry => entry.fileName === 'test.csv')
      )
      .on('data', (chunk) => {
        fileContents += chunk;
      })
      .on('end', () => {
        expect(fileContents).toMatchSnapshot();
        done();
      });
    });

    describe('when not file found', () => {
      it('should throw an error', async () => {
        fs.closeSync(fs.openSync(path.join(__dirname, '/invalid_zip.zip'), 'w'));
        try {
          await zipFile(path.join(__dirname, '/zipData/test.zip'))
          .findReadStream(entry => entry.fileName === 'non_existent');
        } catch (e) {
          expect(e).toBeDefined();
        }
      });
    });

    describe('when zip is invalid', () => {
      it('should throw an error', async () => {
        fs.closeSync(fs.openSync(path.join(__dirname, '/invalid_zip.zip'), 'w'));
        try {
          await zipFile(path.join(__dirname, '/invalid_zip.zip'))
          .findReadStream(entry => entry.fileName === 'test.csv');
        } catch (e) {
          expect(e).toBeDefined();
        }
      });
    });
  });
});
