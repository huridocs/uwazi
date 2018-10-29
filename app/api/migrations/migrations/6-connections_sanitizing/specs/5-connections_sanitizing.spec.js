import { catchErrors } from 'api/utils/jasmineHelpers';
import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration connections_sanitizing', () => {
  beforeEach((done) => {
    spyOn(process.stdout, 'write');
    testingDB.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(6);
  });

  describe('Missing connections', () => {
    it('should restore the missing connections', async () => {
      await migration.up(testingDB.mongodb);
      const migratedConnections = await testingDB.mongodb.collection('connections').find().toArray();
      expect(migratedConnections).toBe('bla');
    });
  });
});
