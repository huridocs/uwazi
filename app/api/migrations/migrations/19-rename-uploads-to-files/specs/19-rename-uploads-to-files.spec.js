import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration rename-uploads-to-files', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(19);
  });

  it('should rename uploads collection to files', async () => {
    await migration.up(testingDB.mongodb);

    const uploads = await testingDB.mongodb.collection('uploads').find().toArray();

    expect(uploads.length).toBe(0);

    const files = await testingDB.mongodb.collection('files').find().toArray();

    expect(files).toEqual([
      expect.objectContaining({ filename: 'test.txt' }),
      expect.objectContaining({ filename: 'test2.txt' }),
    ]);
  });

  it('should not fail when uploads collection does not exist', async () => {
    await testingDB.mongodb.collection('uploads').drop();
    await migration.up(testingDB.mongodb);
  });

  describe('when files already exists', () => {
    beforeEach(async () => {
      const collections = await testingDB.mongodb.listCollections().toArray();
      if (!collections.find(c => c.name === 'files')) {
        await testingDB.mongodb.createCollection('files');
      }
    });

    it('should not fail', async () => {
      await migration.up(testingDB.mongodb);
    });

    it('should not delete files when uploads does not exists (migration already ran)', async () => {
      await testingDB.mongodb.collection('uploads').drop();

      await migration.up(testingDB.mongodb);
      expect((await testingDB.mongodb.listCollections({ name: 'files' }).toArray()).length).toBe(1);
    });
  });
});
