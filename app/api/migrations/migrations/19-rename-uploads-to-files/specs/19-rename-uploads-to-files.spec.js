import { catchErrors } from 'api/utils/jasmineHelpers';
import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration rename-uploads-to-files', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    testingDB
      .clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(19);
  });

  it('should rename uploads collection to files', async () => {
    await migration.up(testingDB.mongodb);

    const uploads = await testingDB.mongodb
      .collection('uploads')
      .find()
      .toArray();

    expect(uploads.length).toBe(0);

    const files = await testingDB.mongodb
      .collection('files')
      .find()
      .toArray();

    expect(files).toEqual([
      expect.objectContaining({ filename: 'test.txt' }),
      expect.objectContaining({ filename: 'test2.txt' }),
    ]);
  });
});
