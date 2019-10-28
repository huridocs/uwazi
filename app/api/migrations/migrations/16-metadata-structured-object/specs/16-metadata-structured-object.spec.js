import { catchErrors } from 'api/utils/jasmineHelpers';
import testingDB from 'api/utils/testing_db';
import migration from '../index';
import fixtures from './fixtures';

describe('migration metadata-structured-object', () => {
  beforeEach((done) => {
    //spyOn(process.stdout, 'write');
    testingDB.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(16);
  });

  it('should remove connections that have entities that no longer exists', async () => {
    await migration.up(testingDB.mongodb);
    const entities = await testingDB.mongodb.collection('entities').find().toArray();

    console.info(entities[0].metadata['issues'][0]);
  });
});
