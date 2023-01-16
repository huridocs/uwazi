import testingDB from 'api/utils/testing_db';
import { config } from 'api/config';
// eslint-disable-next-line node/no-restricted-import
import * as fs from 'fs';
import migration from '../index';
import { fixtures } from './fixtures';

describe('migration Clean up orphan files', () => {
  beforeEach(async () => {
    jest.spyOn(fs.promises, 'unlink').mockReturnValue(Promise.resolve());
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    config.defaultTenant.uploadedDocuments = `${__dirname}/documents`;
    config.defaultTenant.attachments = `${__dirname}/attachments`;
    config.defaultTenant.customUploads = `${__dirname}/custom`;
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(69);
  });

  it("should remove attachments, documents, and thumbnails if entity doesn't exist", async () => {
    await migration.up(testingDB.mongodb);

    const files = await testingDB.mongodb.collection('files').find({}).toArray();

    expect(files.length).toBe(4);
    expect(files).toMatchObject([
      { type: 'custom', filename: 'custom1.jpg' },
      { type: 'attachment', entity: 'test_doc', filename: 'attachment1.pdf' },
      { type: 'document', entity: 'test_doc', filename: 'document1.pdf' },
      { type: 'thumbnail', entity: 'test_doc', filename: 'thumbnail1.jpg' },
    ]);

    expect(fs.promises.unlink).toHaveBeenCalledWith(`${__dirname}/documents/document2.pdf`);
    expect(fs.promises.unlink).toHaveBeenCalledWith(`${__dirname}/documents/thumbnail2.jpg`);
    expect(fs.promises.unlink).toHaveBeenCalledWith(`${__dirname}/attachments/attachment2.pdf`);
  });

  it('should not fail to unlink if the file does not exists', async () => {
    fs.promises.unlink.mockRestore();
    await migration.up(testingDB.mongodb);
  });
});
