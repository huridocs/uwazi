import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '../MigrateCollectionToPostgres.js';
import { IXModelsMigrationConfig } from '../configs/IXModelsMigrationConfig.js';

const EXTRACTOR_ID = '64a1b2c3d4e5f6a7b8c9e001';

describe('IXModelsMigrationConfig', () => {
  const TENANT = 'ix-models-migration-tenant';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['ixmodels', 'ixextractors']);
    await testingPG.clear(['ix_models', 'ix_extractors']);

    const extractor = { name: 'extractor', property: 'target', source: { pdf: true } };
    await testingDB
      .db(testingDB.dbName)
      .collection('ixextractors')
      .insertOne({ ...extractor, _id: new ObjectId(EXTRACTOR_ID), templates: [] });
    await testingPG.setFixtures({
      ix_extractors: [{ ...extractor, _id: EXTRACTOR_ID, tenant_id: TENANT }],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const migrate = async (docs: Record<string, unknown>[]) => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('ixmodels').insertMany(docs);

    const result = await new MigrateCollectionToPostgres(mongoDb, TENANT).migrate(
      IXModelsMigrationConfig
    );
    const rows = (await testingPG.getAllFrom('ix_models')).filter(row => row.tenant_id === TENANT);

    return { result, rows };
  };

  it('should migrate a model with its ids as hex strings and its process run as JSONB', async () => {
    const processRun = {
      mode: 'process_selected',
      suggestionsRunTimestamp: 1000,
      find: { enabled: true, filters: { obsolete: true }, selectedSharedIds: ['a', 'b'] },
      autoAcceptProgress: { total: 2, processed: 1 },
      findSuggestionsSharedIds: ['b'],
      findSuggestionsInitialSharedIdsCount: 2,
    };

    const { result, rows } = await migrate([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e1'),
        extractorId: new ObjectId(EXTRACTOR_ID),
        creationDate: 1690000000000,
        status: 'ready',
        findingSuggestions: false,
        maxSuggestionsToFind: 100,
        totalSuggestionsToFind: 40,
        processRun,
      },
    ]);

    expect(result.migrated).toBe(1);
    expect(rows).toEqual([
      {
        _id: '64a1b2c3d4e5f6a7b8c9d0e1',
        tenant_id: TENANT,
        extractorId: EXTRACTOR_ID,
        creationDate: 1690000000000,
        status: 'ready',
        findingSuggestions: false,
        maxSuggestionsToFind: 100,
        totalSuggestionsToFind: 40,
        processRun,
      },
    ]);
  });

  it('should store absent optional fields as null, and absent defaulted fields as their default', async () => {
    const { rows } = await migrate([
      { _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e2'), extractorId: new ObjectId(EXTRACTOR_ID) },
    ]);

    expect(rows).toEqual([
      expect.objectContaining({
        creationDate: null,
        status: 'processing',
        findingSuggestions: true,
        maxSuggestionsToFind: null,
        totalSuggestionsToFind: null,
        processRun: null,
      }),
    ]);
  });

  it('should strip characters JSONB rejects from the process run and keep explicit nulls', async () => {
    const { rows } = await migrate([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e3'),
        extractorId: new ObjectId(EXTRACTOR_ID),
        creationDate: 1,
        processRun: { mode: 'process\u0007_all', find: { selectedSharedIds: null } },
      },
    ]);

    expect(rows).toEqual([
      expect.objectContaining({
        processRun: { mode: 'process_all', find: { selectedSharedIds: null } },
      }),
    ]);
  });

  it('should skip a model whose extractor no longer exists', async () => {
    const { result, rows } = await migrate([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e4'),
        extractorId: new ObjectId(EXTRACTOR_ID),
        creationDate: 1,
      },
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e5'),
        extractorId: new ObjectId('64a1b2c3d4e5f6a7b8c9e999'),
        creationDate: 1,
      },
    ]);

    expect(result).toEqual({ migrated: 1, orphansSkipped: 1, skipped: false });
    expect(rows.map(row => row._id)).toEqual(['64a1b2c3d4e5f6a7b8c9d0e4']);
  });
});
