import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '../MigrateCollectionToPostgres.js';
import { IXSuggestionsMigrationConfig } from '../configs/IXSuggestionsMigrationConfig.js';

const EXTRACTOR_ID = '64a1b2c3d4e5f6a7b8c9e001';
const TEMPLATE_ID = '64a1b2c3d4e5f6a7b8c9f001';

const state = {
  labeled: true,
  withValue: true,
  withSuggestion: true,
  match: null,
  hasContext: true,
  obsolete: false,
  processing: false,
  error: false,
};

describe('IXSuggestionsMigrationConfig', () => {
  const TENANT = 'ix-suggestions-migration-tenant';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['ixsuggestions', 'ixextractors']);
    await testingPG.clear(['ix_suggestions', 'ix_extractors']);

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
    await mongoDb.collection('ixsuggestions').insertMany(docs);

    const result = await new MigrateCollectionToPostgres(mongoDb, TENANT).migrate(
      IXSuggestionsMigrationConfig
    );
    const rows = (await testingPG.getAllFrom('ix_suggestions')).filter(
      row => row.tenant_id === TENANT
    );

    return { result, rows };
  };

  it('should migrate a text-source suggestion with its ids as hex strings', async () => {
    const { result, rows } = await migrate([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e1'),
        extractorId: new ObjectId(EXTRACTOR_ID),
        entityId: 'shared1',
        entityLanguageId: new ObjectId('64a1b2c3d4e5f6a7b8c9a001'),
        entityTemplate: TEMPLATE_ID,
        entityTitle: 'Entity',
        propertyName: 'title',
        language: 'en',
        suggestedValue: 'suggested',
        suggestedText: 'text',
        currentValue: 1690000000,
        segment: 'the segment',
        status: 'ready',
        error: '',
        date: 1000,
        state,
        modelData: { suggestionsRunTimestamp: 500 },
        useForTraining: true,
        trainingSample: false,
      },
    ]);

    expect(result.migrated).toBe(1);
    expect(rows).toEqual([
      {
        _id: '64a1b2c3d4e5f6a7b8c9d0e1',
        tenant_id: TENANT,
        extractorId: EXTRACTOR_ID,
        entityId: 'shared1',
        entityLanguageId: '64a1b2c3d4e5f6a7b8c9a001',
        entityTemplate: TEMPLATE_ID,
        entityTitle: 'Entity',
        fileId: null,
        propertyName: 'title',
        language: 'en',
        suggestedValue: 'suggested',
        suggestedText: 'text',
        currentValue: 1690000000,
        segment: 'the segment',
        selectionRectangles: null,
        status: 'ready',
        error: '',
        date: 1000,
        state,
        modelData: { suggestionsRunTimestamp: 500 },
        useForTraining: true,
        trainingSample: false,
      },
    ]);
  });

  it('should migrate a pdf-source suggestion with its file id, rectangles and array value', async () => {
    const selectionRectangles = [{ top: 1, left: 2, width: 3, height: 4, page: '1' }];
    const suggestedValue = [{ id: 'option1', label: 'Option 1' }];

    const { rows } = await migrate([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e2'),
        extractorId: new ObjectId(EXTRACTOR_ID),
        entityId: 'shared2',
        entityTemplate: TEMPLATE_ID,
        fileId: new ObjectId('64a1b2c3d4e5f6a7b8c9b001'),
        propertyName: 'select',
        language: 'en',
        suggestedValue,
        selectionRectangles,
        status: 'ready',
        date: 1000,
        state,
      },
    ]);

    expect(rows).toEqual([
      expect.objectContaining({
        fileId: '64a1b2c3d4e5f6a7b8c9b001',
        suggestedValue,
        selectionRectangles,
      }),
    ]);
  });

  it('should drop dead fields, default status and useForTraining, and store absent fields as null', async () => {
    const { rows } = await migrate([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e3'),
        extractorId: new ObjectId(EXTRACTOR_ID),
        entityId: 'shared3',
        entityTemplate: TEMPLATE_ID,
        propertyName: 'title',
        language: 'en',
        suggestedValue: '',
        date: null,
        page: 3,
        labeledValue: 'labeled',
      },
    ]);

    expect(rows).toEqual([
      {
        _id: '64a1b2c3d4e5f6a7b8c9d0e3',
        tenant_id: TENANT,
        extractorId: EXTRACTOR_ID,
        entityId: 'shared3',
        entityLanguageId: null,
        entityTemplate: TEMPLATE_ID,
        entityTitle: null,
        fileId: null,
        propertyName: 'title',
        language: 'en',
        suggestedValue: '',
        suggestedText: null,
        currentValue: null,
        segment: null,
        selectionRectangles: null,
        status: 'processing',
        error: null,
        date: null,
        state: null,
        modelData: null,
        useForTraining: false,
        trainingSample: null,
      },
    ]);
  });

  it('should strip characters Postgres rejects from strings and JSONB values', async () => {
    const { rows } = await migrate([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e4'),
        extractorId: new ObjectId(EXTRACTOR_ID),
        entityId: 'shared4',
        entityTemplate: TEMPLATE_ID,
        entityTitle: 'Ti\u0007tle',
        propertyName: 'title',
        language: 'en',
        suggestedValue: 'val\u0000ue',
        segment: 'segment',
      },
    ]);

    expect(rows).toEqual([
      expect.objectContaining({
        entityTitle: 'Title',
        suggestedValue: 'value',
        segment: 'segment',
      }),
    ]);
  });

  it('should skip a suggestion whose extractor no longer exists', async () => {
    const base = { entityTemplate: TEMPLATE_ID, propertyName: 'p', language: 'en' };

    const { result, rows } = await migrate([
      {
        ...base,
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e5'),
        extractorId: new ObjectId(EXTRACTOR_ID),
        entityId: 'kept',
        suggestedValue: '',
      },
      {
        ...base,
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e6'),
        extractorId: new ObjectId('64a1b2c3d4e5f6a7b8c9e999'),
        entityId: 'orphan',
        suggestedValue: '',
      },
    ]);

    expect(result).toEqual({ migrated: 1, orphansSkipped: 1, skipped: false });
    expect(rows.map(row => row.entityId)).toEqual(['kept']);
  });
});
