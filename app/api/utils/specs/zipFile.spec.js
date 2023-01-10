import path from 'path';
import { deleteFiles } from 'api/files';
import { createTestingZip } from 'api/csv/specs/helpers';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import zipFile from '../zipFile';

describe('zipFile', () => {
  beforeAll(async () => {
    await createTestingZip(
      [
        path.join(__dirname, '/zipData/test.csv'),
        path.join(__dirname, '/zipData/1.pdf'),
        path.join(__dirname, '/zipData/2.pdf'),
      ],
      'zipTest.zip',
      __dirname
    );
  });

  afterAll(async () => {
    await deleteFiles([
      path.join(__dirname, '/zipData/zipTest.zip'),
      path.join(__dirname, '/invalid_zip.zip'),
    ]);
  });

  describe('findReadStream', () => {
    it('should return a readable stream for matched file', async () => {
      let fileContents;
      await new Promise((resolve, reject) => {
        zipFile(path.join(__dirname, '/zipData/zipTest.zip'))
          .findReadStream(entry => entry === 'test.csv')
          .then(file => {
            file
              .on('data', chunk => {
                fileContents += chunk;
              })
              .on('end', () => {
                expect(fileContents).toMatchSnapshot();
                resolve();
              })
              .on('error', e => {
                reject(e);
              });
          });
      });
    });

    describe('when not file found', () => {
      it('should return null', async () => {
        const stream = await zipFile(path.join(__dirname, '/zipData/zipTest.zip')).findReadStream(
          entry => entry.fileName === 'non_existent'
        );

        expect(stream).toBe(null);
      });
    });

    describe('when zip is invalid', () => {
      it('should throw an error', async () => {
        (await fs.open(path.join(__dirname, '/invalid_zip.zip'), 'w')).close();
        try {
          await zipFile(path.join(__dirname, '/invalid_zip.zip')).findReadStream(
            entry => entry.fileName === 'test.csv'
          );
          fail('should throw an error');
        } catch (e) {
          expect(e).toBeDefined();
        }
      });
    });
  });
});
