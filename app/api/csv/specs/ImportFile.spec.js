import path from 'path';
import yazl from 'yazl';
import fs from 'fs';
import ImportFile from '../ImportFile';

describe('ImportFile', () => {
  beforeAll((done) => {
    const zipfile = new yazl.ZipFile();
    zipfile.addFile(path.join(__dirname, '/zipData/test.csv'), 'test.csv');
    zipfile.addFile(path.join(__dirname, '/zipData/file1.txt'), 'file1.txt');
    zipfile.end();
    zipfile
    .outputStream
    .pipe(fs.createWriteStream(path.join(__dirname, '/zipData/ImportFile.zip')))
    .on('close', done)
    .on('error', (e) => {
      done.fail(e);
    });
  });

  afterAll(() => {
    fs.unlinkSync(path.join(__dirname, '/zipData/ImportFile.zip'));
  });

  describe('readStream', () => {
    it('should return a readable stream for the csv file', async (done) => {
      const file = new ImportFile(path.join(__dirname, '/test.csv'));
      let fileContents;
      (await file.readStream())
      .on('data', (chunk) => {
        fileContents += chunk;
      })
      .on('end', () => {
        expect(fileContents).toMatchSnapshot();
        done();
      });
    });

    describe('when file is a a zip', () => {
      it('should return a stream for the first csv file it encounters', async (done) => {
        const file = new ImportFile(path.join(__dirname, '/zipData/ImportFile.zip'));
        let fileContents;
        (await file.readStream())
        .on('data', (chunk) => {
          fileContents += chunk;
        })
        .on('end', () => {
          expect(fileContents).toMatchSnapshot();
          done();
        });
      });

      describe('when passing a filename', () => {
        it('should return a read stream for that file', async (done) => {
          const file = new ImportFile(path.join(__dirname, '/zipData/ImportFile.zip'));
          let fileContents;
          (await file.readStream('file1.txt'))
          .on('data', (chunk) => {
            fileContents += chunk;
          })
          .on('end', () => {
            expect(fileContents).toMatchSnapshot();
            done();
          });
        });
      });
    });
  });
});
