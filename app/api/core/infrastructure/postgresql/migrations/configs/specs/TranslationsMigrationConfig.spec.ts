import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '../../MigrateCollectionToPostgres.js';
import { TranslationsMigrationConfig } from '../TranslationsMigrationConfig.js';

describe('TranslationsMigrationConfig', () => {
  it('should flatten mongo translationsV2 docs to translations rows', () => {
    const id = new ObjectId();
    const mapped = TranslationsMigrationConfig.mapDocument({
      _id: id,
      language: 'es',
      key: 'Search',
      value: 'Buscar',
      context: { id: 'System', type: 'Uwazi UI', label: 'User Interface' },
    });

    expect(TranslationsMigrationConfig.mongoCollection).toBe('translationsV2');
    expect(TranslationsMigrationConfig.pgTable).toBe('translations');
    expect(mapped).toEqual({
      _id: id.toHexString(),
      language: 'es',
      key: 'Search',
      value: 'Buscar',
      context_id: 'System',
      context_type: 'Uwazi UI',
      context_label: 'User Interface',
    });
  });

  it('should stringify non-ObjectId ids and default missing values', () => {
    const mapped = TranslationsMigrationConfig.mapDocument({
      _id: 'abc123',
      language: 'en',
      key: 'Search',
      context: { id: 'System', type: 'Uwazi UI', label: 'User Interface' },
    });

    expect(mapped._id).toBe('abc123');
    expect(mapped.value).toBe('');
  });

  it('should throw when context type or label is missing', () => {
    expect(() =>
      TranslationsMigrationConfig.mapDocument({
        _id: 'abc123',
        language: 'en',
        key: 'Search',
        context: { id: 'unknown-context' },
      })
    ).toThrow(/missing required context fields/);
  });
});

describe('TranslationsMigrationConfig copy', () => {
  const TENANT = 'translations-migration-tenant';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['translationsV2']);
    await testingPG.clear(['translations']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const makeMigrator = () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    return new MigrateCollectionToPostgres(mongoDb, TENANT);
  };

  it('should copy complete documents', async () => {
    const id = new ObjectId();
    await testingDB
      .db(testingDB.dbName)
      .collection('translationsV2')
      .insertOne({
        _id: id,
        language: 'es',
        key: 'Search',
        value: 'Buscar',
        context: { id: 'System', type: 'Uwazi UI', label: 'User Interface' },
      });

    const result = await makeMigrator().migrate(TranslationsMigrationConfig);

    expect(result).toEqual({ migrated: 1, skipped: false });

    const rows = (await testingPG.getAllFrom('translations')).filter(r => r.tenant_id === TENANT);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      _id: id.toHexString(),
      language: 'es',
      key: 'Search',
      value: 'Buscar',
      context_id: 'System',
      context_type: 'Uwazi UI',
      context_label: 'User Interface',
    });
  });
});
