import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration reset files stuck in processing', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    migration.reindex = false;
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(121);
  });

  it('should set the file status to "ready" for files with text (even empty objects)', async () => {
    await testingDB.setupFixturesAndContext(fixtures);
    await migration.up(testingDB.mongodb);

    const filesReady = await testingDB.mongodb
      .collection('files')
      .find({ status: 'ready' })
      .toArray();
    const filesReadyNames = filesReady.map(f => f.originalname);

    expect(filesReady.length).toBe(3);
    expect(filesReadyNames).toContain('status ready file');
    expect(filesReadyNames).toContain('status processsing file (with text)');
    expect(filesReadyNames).toContain('status processsing file (with text 2)');
  });

  it('should set the file status to "failed" for files without the text key', async () => {
    await testingDB.setupFixturesAndContext(fixtures);
    await migration.up(testingDB.mongodb);

    const filesFailed = await testingDB.mongodb
      .collection('files')
      .find({ status: 'failed' })
      .toArray();
    const filesFailedNames = filesFailed.map(f => f.originalname);

    expect(filesFailed.length).toBe(3);
    expect(filesFailedNames).toContain('status failed file');
    expect(filesFailedNames).toContain('status processsing file (no text)');
    expect(filesFailedNames).toContain('status processsing file (no text 2)');
  });

  it('should reindex if there are files migrated', async () => {
    await testingDB.setupFixturesAndContext(fixtures);
    await migration.up(testingDB.mongodb);
    expect(migration.reindex).toBe(true);
  });

  it('should not reindex if no files where stuck in processing', async () => {
    await testingDB.setupFixturesAndContext({
      files: [{ status: 'ready' }, { status: 'failed' }, { originalname: 'without status' }],
    });
    await migration.up(testingDB.mongodb);
    expect(migration.reindex).toBe(false);
  });
});
