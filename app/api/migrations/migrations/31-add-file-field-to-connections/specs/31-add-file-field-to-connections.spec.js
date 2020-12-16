import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { connectionWithRangeId, documentId } from './fixtures.js';
import { catchErrors } from 'api/utils/jasmineHelpers';
import errorLog from 'api/log/errorLog';
import { config } from 'api/config';

describe('migration add-file-field-to-connections', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    spyOn(errorLog, 'error');
    config.defaultTenant.uploadedDocuments = __dirname;
    testingDB
      .clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(31);
  });

  it('should add file field to connection', async () => {
    await migration.up(testingDB.mongodb);

    const connections = await testingDB.mongodb
      .collection('connections')
      .find({ _id: connectionWithRangeId })
      .toArray();

    expect(connections).toEqual([
      expect.objectContaining({
        file: documentId.toString(),
      }),
    ]);
  });
});
