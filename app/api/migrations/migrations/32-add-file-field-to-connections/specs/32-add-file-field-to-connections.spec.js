import { config } from 'api/config';
import testingDB from 'api/utils/testing_db';
import { catchErrors } from 'api/utils/jasmineHelpers';
import { errorLog } from 'api/log';
import fixtures, { connectionWithRangeId, documentId } from './fixtures.js';
import migration from '../index.js';

describe('migration add-file-field-to-connections', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    spyOn(errorLog, 'error');
    config.defaultTenant.uploadedDocuments = __dirname;
    testingDB.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(32);
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

  it('should work with unsuported languages by elastic without errors', async () => {
    fixtures.settings[0].languages = [
      {
        key: 'ja',
        default: true,
      },
    ];
    await testingDB.clearAllAndLoad(fixtures);
    await migration.up(testingDB.mongodb);
  });
});
