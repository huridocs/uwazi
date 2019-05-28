import path from 'path';
import fs from 'fs';
import importFile from '../importFile';
import { createTestingZip } from './helpers';

describe('importFile', () => {
  beforeAll(async () => {
    await createTestingZip([
      path.join(__dirname, '/zipData/test.csv'),
      path.join(__dirname, '/zipData/file1.txt'),
    ], 'ImportFile.zip');
  });

  afterAll(() => {
    fs.unlinkSync(path.join(__dirname, '/zipData/ImportFile.zip'));
  });

  describe('readStream', () => {
    it('should return a readable stream for the csv file', async (done) => {
      const file = importFile(path.join(__dirname, '/test.csv'));
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
        const file = importFile(path.join(__dirname, '/zipData/ImportFile.zip'));
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
          const file = importFile(path.join(__dirname, '/zipData/ImportFile.zip'));
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
