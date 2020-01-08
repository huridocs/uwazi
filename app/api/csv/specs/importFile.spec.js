/** @format */

import path from 'path';
import fs from 'fs';
import importFile from '../importFile';
import { createTestingZip } from './helpers';

describe('importFile', () => {
  beforeAll(async () => {
    await createTestingZip(
      [path.join(__dirname, '/zipData/import.csv'), path.join(__dirname, '/zipData/file1.txt')],
      'ImportFile.zip'
    );

    await createTestingZip([path.join(__dirname, '/zipData/file1.txt')], 'badFile.zip');
  });

  afterAll(() => {
    fs.unlinkSync(path.join(__dirname, '/zipData/ImportFile.zip'));
    fs.unlinkSync(path.join(__dirname, '/zipData/badFile.zip'));
  });

  describe('readStream', () => {
    it('should return a readable stream for the csv file', async done => {
      const file = importFile(path.join(__dirname, '/test.csv'));
      let fileContents;
      (await file.readStream())
        .on('data', chunk => {
          fileContents += chunk;
        })
        .on('end', () => {
          expect(fileContents).toMatchSnapshot();
          done();
        });
    });

    describe('when file is a a zip', () => {
      it('should return a stream for the first csv file it encounters', async done => {
        const file = importFile(path.join(__dirname, '/zipData/ImportFile.zip'));
        let fileContents;
        (await file.readStream())
          .on('data', chunk => {
            fileContents += chunk;
          })
          .on('end', () => {
            expect(fileContents).toMatchSnapshot();
            done();
          });
      });

      describe('when passing a filename', () => {
        it('should return a read stream for that file', async done => {
          const file = importFile(path.join(__dirname, '/zipData/ImportFile.zip'));
          let fileContents;
          (await file.readStream('file1.txt'))
            .on('data', chunk => {
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

  describe('when there is no import.csv on the zip', () => {
    it('should throw an error', async () => {
      const file = importFile(path.join(__dirname, '/zipData/badFile.zip'));
      let error;
      try {
        await file.readStream();
      } catch (e) {
        error = e;
      }

      expect(error.message.match(/import\.csv/)).not.toBeNull();
    });
  });
});
