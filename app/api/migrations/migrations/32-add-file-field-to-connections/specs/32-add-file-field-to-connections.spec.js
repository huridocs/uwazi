import { config } from '#api/config.js';
import testingDB from '#api/utils/testing_db.js';
import { legacyLogger } from '#api/log/index.js';
import fixtures, { connectionWithRangeId, documentId } from '#api/migrations/migrations/32-add-file-field-to-connections/specs/fixtures.js';
import migration from '#api/migrations/migrations/32-add-file-field-to-connections/index.js';

describe('migration add-file-field-to-connections', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    jest.spyOn(legacyLogger, 'error').mockImplementation(() => {});
    config.defaultTenant.uploadedDocuments = __dirname;
    await testingDB.setupFixturesAndContext(fixtures);
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
