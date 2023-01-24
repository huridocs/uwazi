//eslint-disable-next-line node/no-restricted-import
import fs from 'fs';
import path from 'path';
import testingDB from 'api/utils/testing_db';
import { config } from 'api/config';
import migration from '../index.js';
import fixtures from './fixtures.js';

const asyncFs = fs.promises;

export const fileExists = async filePath =>
  new Promise((resolve, reject) => {
    fs.stat(filePath, err => {
      if (err === null) {
        resolve(true);
      }
      if (err && err.code === 'ENOENT') {
        resolve(false);
      }
      if (err) {
        reject(err);
      }
    });
  });

describe('migration separate-custom-uploads-from-documents', () => {
  let originalDocumentsPath;
  let originalUploadsPath;

  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    originalDocumentsPath = config.defaultTenant.uploadedDocuments;
    originalUploadsPath = config.defaultTenant.customUploads;
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterEach(done => {
    config.defaultTenant.uploadedDocuments = originalDocumentsPath;
    config.defaultTenant.customUploads = originalUploadsPath;
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
      config.defaultTenant.uploadedDocuments = `${__dirname}/uploaded_documents/`;
      config.defaultTenant.customUploads = `${__dirname}/custom_uploads/`;
    });
    afterEach(async () => {
      await Promise.all(
        files.map(async f => {
          try {
            await asyncFs.unlink(path.join(config.defaultTenant.customUploads, f));
            // eslint-disable-next-line
          } catch (e) {}
        })
      );
    });
    const initFiles = async () =>
      Promise.all(
        files.map(f =>
          asyncFs.writeFile(
            path.join(config.defaultTenant.uploadedDocuments, f),
            `contents for file ${f}`
          )
        )
      );
    it('should move all uploads from uploaded documents folder to custom uploads folder', async () => {
      await initFiles();
      await migration.up(testingDB.mongodb);
      const filesExistInOldPath = await Promise.all(
        files.map(f => fileExists(path.join(config.defaultTenant.uploadedDocuments, f)))
      );
      const filesExistInNewPath = await Promise.all(
        files.map(f => fileExists(path.join(config.defaultTenant.customUploads, f)))
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
