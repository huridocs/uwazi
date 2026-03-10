//eslint-disable-next-line node/no-restricted-import
import fs from 'fs';
import { promisify } from 'util';

import { legacyLogger } from 'api/log';
import { config } from 'api/config';
import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { docId1, docId4 } from './fixtures.js';

const exists = promisify(fs.stat);

describe('migration pdf_thumbnails', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    jest.spyOn(legacyLogger, 'error').mockImplementation(() => {});
    config.defaultTenant.uploadedDocuments = __dirname;
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(4);
  });

  describe('JPG creation', () => {
    const thumbnail1 = `${__dirname}/${docId1}.jpg`;
    const thumbnail2 = `${__dirname}/${docId4}.jpg`;

    const deleteThumbnails = done => {
      try {
        fs.unlinkSync(thumbnail1);
        fs.unlinkSync(thumbnail2);
        done();
      } catch (err) {
        done();
      }
    };

    beforeEach(done => {
      deleteThumbnails(done);
    });

    afterEach(done => {
      deleteThumbnails(done);
    });

    it('should create thumbnails of document PDFs', async () => {
      await migration.up(testingDB.mongodb);
      await exists(thumbnail1);
      await exists(thumbnail2);
    });
  });
});
