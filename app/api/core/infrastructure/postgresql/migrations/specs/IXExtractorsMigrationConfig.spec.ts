import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '../MigrateCollectionToPostgres.js';
import { IXExtractorsMigrationConfig } from '../configs/IXExtractorsMigrationConfig.js';

describe('IXExtractorsMigrationConfig', () => {
  const TENANT = 'ix-extractors-migration-tenant';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['ixextractors']);
    await testingPG.clear(['ix_extractors']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const migrate = async (docs: Record<string, unknown>[]) => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('ixextractors').insertMany(docs);

    const result = await new MigrateCollectionToPostgres(mongoDb, TENANT).migrate(
      IXExtractorsMigrationConfig
    );
    const rows = (await testingPG.getAllFrom('ix_extractors')).filter(
      row => row.tenant_id === TENANT
    );

    return { result, rows };
  };

  it('should migrate a property-source extractor with its ids as hex strings', async () => {
    const { result, rows } = await migrate([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e1'),
        name: 'Code extractor',
        property: 'extracted_code',
        source: { property: 'source_text' },
        templates: [
          new ObjectId('64a1b2c3d4e5f6a7b8c9a001'),
          new ObjectId('64a1b2c3d4e5f6a7b8c9a002'),
        ],
      },
    ]);

    expect(result.migrated).toBe(1);
    expect(rows).toEqual([
      {
        _id: '64a1b2c3d4e5f6a7b8c9d0e1',
        tenant_id: TENANT,
        name: 'Code extractor',
        property: 'extracted_code',
        source: { property: 'source_text' },
        templates: ['64a1b2c3d4e5f6a7b8c9a001', '64a1b2c3d4e5f6a7b8c9a002'],
      },
    ]);
  });

  it('should migrate a pdf-source extractor', async () => {
    const { rows } = await migrate([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e2'),
        name: 'PDF extractor',
        property: 'pdf_code',
        source: { pdf: true },
        templates: [new ObjectId('64a1b2c3d4e5f6a7b8c9a001')],
      },
    ]);

    expect(rows).toEqual([
      expect.objectContaining({
        _id: '64a1b2c3d4e5f6a7b8c9d0e2',
        source: { pdf: true },
        templates: ['64a1b2c3d4e5f6a7b8c9a001'],
      }),
    ]);
  });

  it('should store an extractor without templates as an empty list', async () => {
    const { rows } = await migrate([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e3'),
        name: 'Orphaned extractor',
        property: 'target',
        source: { property: 'source' },
      },
    ]);

    expect(rows).toEqual([expect.objectContaining({ templates: [] })]);
  });
});
