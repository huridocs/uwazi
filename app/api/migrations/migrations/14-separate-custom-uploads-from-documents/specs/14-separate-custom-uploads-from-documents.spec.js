import path from 'path';
import { catchErrors } from 'api/utils/jasmineHelpers';
import testingDB from 'api/utils/testing_db';
import fs from 'api/utils/async-fs';
import paths from 'api/config/paths';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration separate-custom-uploads-from-documents', () => {
  let originalDocumentsPath;
  let originalUploadsPath;

  beforeEach(done => {
    spyOn(process.stdout, 'write');
    originalDocumentsPath = paths.uploadedDocuments;
    originalUploadsPath = paths.customUploads;
    testingDB
      .clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterEach(done => {
    paths.uploadedDocuments = originalDocumentsPath;
    paths.customUploads = originalUploadsPath;
    done();
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(14);
  });

  describe('up', () => {
    let files;
    beforeEach(async () => {
      files = ['file1.txt', 'file2.txt', 'file3.txt'];
      paths.uploadedDocuments = `${__dirname}/uploaded_documents/`;
      paths.customUploads = `${__dirname}/custom_uploads/`;
    });
    afterEach(async () => {
      await Promise.all(
        files.map(async f => {
          try {
            await fs.unlink(path.join(paths.customUploads, f));
            // eslint-disable-next-line
          } catch (e) {}
        })
      );
    });
    const initFiles = async () =>
      Promise.all(
        files.map(f =>
          fs.writeFile(path.join(paths.uploadedDocuments, f), `contents for file ${f}`)
        )
      );
    it('should move all uploads from uploaded documents folder to custom uploads folder', async () => {
      await initFiles();
      await migration.up(testingDB.mongodb);
      const filesExistInOldPath = await Promise.all(
        files.map(f => fs.exists(path.join(paths.uploadedDocuments, f)))
      );
      const filesExistInNewPath = await Promise.all(
        files.map(f => fs.exists(path.join(paths.customUploads, f)))
      );
      expect(filesExistInOldPath).toEqual([false, false, false]);
      expect(filesExistInNewPath).toEqual([true, true, true]);
    });
    it('should not throw error if file does not exist', async () => {
      await initFiles();
      files.push('unknown.txt');
      await migration.up(testingDB.mongodb);
    });
  });
});
