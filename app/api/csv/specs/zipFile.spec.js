import path from 'path';
import fs from 'fs';
import zipFile from '../zipFile';
import { createTestingZip } from './helpers';

describe('ImportFile', () => {
  beforeAll(async () => {
    await createTestingZip([
      path.join(__dirname, '/zipData/test.csv'),
      path.join(__dirname, '/zipData/1.pdf'),
      path.join(__dirname, '/zipData/2.pdf'),
    ], 'zipTest.zip');
  });

  afterAll(() => {
    fs.unlinkSync(path.join(__dirname, '/zipData/zipTest.zip'));
    fs.unlinkSync(path.join(__dirname, '/invalid_zip.zip'));
  });

  describe('findReadStream', () => {
    it('should be true', () => {
      expect(true).toBe(true);
    });

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
      })
      .on('error', (e) => {
        done.fail(e);
      });
    });

    describe('when not file found', () => {
      it('should throw an error', async () => {
        try {
          await zipFile(path.join(__dirname, '/zipData/zipTest.zip'))
          .findReadStream(entry => entry.fileName === 'non_existent');
          fail('should throw an error');
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
          fail('should throw an error');
        } catch (e) {
          expect(e).toBeDefined();
        }
      });
    });
  });
});
