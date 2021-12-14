import path from 'path';
import { streamToString, deleteFiles } from 'api/files/filesystem';

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

  afterAll(async () => {
    await deleteFiles([
      path.join(__dirname, '/zipData/ImportFile.zip'),
      path.join(__dirname, '/zipData/badFile.zip'),
    ]);
  });

  describe('readStream', () => {
    it('should return a readable stream for the csv file', async () => {
      const file = importFile(path.join(__dirname, '/test.csv'));
      const fileContents = await streamToString(await file.readStream());
      expect(fileContents).toMatchSnapshot();
    });

    describe('when file is a a zip', () => {
      it('should return a stream for a file that should be called import.csv by default', async () => {
        const file = importFile(path.join(__dirname, '/zipData/ImportFile.zip'));
        const fileContents = await streamToString(await file.readStream());
        expect(fileContents).toMatchSnapshot();
      });

      describe('when passing a filename', () => {
        it('should return a read stream for that file', async () => {
          const file = importFile(path.join(__dirname, '/zipData/ImportFile.zip'));
          const fileContents = await streamToString(await file.readStream('file1.txt'));
          expect(fileContents).toMatchSnapshot();
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
