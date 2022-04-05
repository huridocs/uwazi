import testingDB from 'api/utils/testing_db';
import { config } from 'api/config';
import fs from 'fs/promises';
import migration from '../index';
import { fixtures } from './fixtures';

async function exists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function clearFiles(files) {
  return Promise.all(files.map(f => fs.unlink(`${__dirname}/${f.filename}`)));
}

describe('migration Re create thumbnails', () => {
  beforeEach(async () => {
    spyOn(process.stdout, 'write');
    config.defaultTenant.uploadedDocuments = `${__dirname}`;
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(70);
  });

  it('should crete thumbnails that are missing', async () => {
    await migration.up(testingDB.mongodb);

    const files = await testingDB.mongodb.collection('files').find({}).toArray();

    const thumbnail1 = files.find(f => f.type === 'thumbnail' && f.entity === 'test_doc1');
    const thumbnail2 = files.find(f => f.type === 'thumbnail' && f.entity === 'test_doc2');

    expect(thumbnail1).toMatchObject({
      entity: 'test_doc1',
      language: 'es',
      filename: `${fixtures.files[2]._id.toString()}.jpg`,
    });
    expect(thumbnail2).toMatchObject({
      entity: 'test_doc2',
      language: 'es',
      filename: `${fixtures.files[4]._id.toString()}.jpg`,
    });

    expect(await exists(`${__dirname}/${thumbnail1.filename}`)).toBe(true);
    expect(await exists(`${__dirname}/${thumbnail2.filename}`)).toBe(true);

    await clearFiles([thumbnail1, thumbnail2]);
  });
});
