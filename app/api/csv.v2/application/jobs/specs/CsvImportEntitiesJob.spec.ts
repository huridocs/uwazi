/* eslint-disable max-statements */
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FileSystemStorage } from '#api/core/infrastructure/files/FileSystemStorage.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { RelationshipSyncJob } from '#api/core/infrastructure/jobs/RelationshipSyncJob.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { CsvImportDomain, CsvImportStatus } from '../../../domain/CsvImport.js';
import { CsvImportRow } from '../../../domain/CsvImportRow.js';
import { RowErrorCode } from '../../../domain/CsvImportRowError.js';
import { CsvImportEntitiesJob } from '../CsvImportEntitiesJob.js';
import { CsvImportEntitiesJobFactory } from '../../../infrastructure/factories/CsvImportEntitiesJobFactory.js';
import { cleanupCsvV2QueueJobsByImportIds } from '../../../specs/helpers/queueTestCleanup.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';

const fixturesFactory = getFixturesFactory();

const fixtures = {
  settings: [
    {
      _id: fixturesFactory.id('csvImportSettings'),
      languages: [
        { key: 'en' as LanguageISO6391, label: 'English', default: true },
        { key: 'es' as LanguageISO6391, label: 'Spanish' },
      ],
      dateFormat: 'YYYY/MM/DD',
      features: { newNameGeneration: false },
    },
  ],
  templates: [
    fixturesFactory.template('csvImportTemplate', [
      fixturesFactory.property('description', 'text'),
      fixturesFactory.property('rel_any', 'relationship', {
        content: '',
      }),
    ]),
    fixturesFactory.template('relatedAnyTemplate', [
      fixturesFactory.property('description', 'text'),
    ]),
  ],
};

const createCallbacks = () => ({
  onStart: jest.fn(),
  onProgress: jest.fn(),
  onSuccess: jest.fn(),
  onError: jest.fn(),
});

const stageRows = async (
  rowsDS: {
    insertMany: (rows: CsvImportRow[]) => Promise<void>;
  },
  params: { csv: string; importId: string }
) => {
  const parsed = params.csv.trim().split('\n');
  const headers = parsed
    .shift()!
    .split(',')
    .map(cell => cell.trim());
  const rows = parsed.map((line, index) =>
    CsvImportRow.create({
      importId: params.importId,
      rowIndex: index,
      headers,
      values: line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')),
    })
  );
  await rowsDS.insertMany(rows);
};

const insertImport = async (
  csvImportsDS: { insert: (doc: any) => Promise<void> },
  params: { importId: string; templateId: string; userId: string }
) => {
  const csvImport = CsvImportDomain.withStorage(
    CsvImportDomain.create({
      id: params.importId,
      templateId: params.templateId,
      createdBy: params.userId,
      file: { originalName: 'import.csv', mimeType: 'text/csv', size: 10 },
    }),
    `csv-imports/${params.importId}/original.csv`
  );
  await csvImportsDS.insert(csvImport);
};

const buildUseCase = () => {
  const transactionManager = TransactionManagerFactory.default();
  const fileStorage = new FileSystemStorage(new PathManager({ tenant: tenants.current() }));
  const jobsDispatcher: jest.Mocked<JobsDispatcher> = TestUtils.mockClass<JobsDispatcher>({
    dispatch: jest.fn().mockResolvedValue(undefined),
    dispatchMany: jest.fn().mockResolvedValue(undefined),
  }) as jest.Mocked<JobsDispatcher>;
  const { useCase, csvImportsDS, rowsDS, rowErrorsDS, entitiesDS } =
    CsvImportEntitiesJobFactory.build({
      transactionManager,
      fileStorage,
      batchSize: 2,
      jobsDispatcher,
    });

  return { useCase, csvImportsDS, rowsDS, rowErrorsDS, entitiesDS, jobsDispatcher };
};

const runSingleRowImport = async (params: {
  useCase: CsvImportEntitiesJob;
  csvImportsDS: { insert: (doc: any) => Promise<void>; getById: (id: string) => any };
  rowsDS: { insertMany: (rows: CsvImportRow[]) => Promise<void> };
  rowErrorsDS: { countByImport: (importId: string) => Promise<number> };
  importId: string;
  templateId: string;
  userId: string;
}) => {
  await insertImport(params.csvImportsDS, {
    importId: params.importId,
    templateId: params.templateId,
    userId: params.userId,
  });
  await stageRows(params.rowsDS, {
    importId: params.importId,
    csv: 'title,description\nMy Title,Some description',
  });
  const callbacks = createCallbacks();
  await params.useCase.execute({ importId: params.importId, callbacks });
  const updatedImport = (await params.csvImportsDS.getById(params.importId)).getDataOrThrow();
  const rowErrorsCount = await params.rowErrorsDS.countByImport(params.importId);
  return { callbacks, updatedImport, rowErrorsCount };
};

const expectImportState = (updatedImport: {
  status: CsvImportStatus;
  stats?: { entitiesCreated?: number; rowsProcessed?: number; rowsFailed?: number };
  rowErrors?: unknown;
  failure?: unknown;
}) => {
  expect(updatedImport.status).toBe(CsvImportStatus.ImportEntitiesDone);
  expect(updatedImport.stats).toEqual(
    expect.objectContaining({
      entitiesCreated: 1,
      rowsProcessed: 1,
      rowsFailed: 0,
    })
  );
  expect(updatedImport.rowErrors ?? undefined).toBeUndefined();
  expect(updatedImport.failure ?? undefined).toBeUndefined();
};

const fetchEntitiesByTemplate = async (
  entitiesDS: MultiLanguageEntityDataSource,
  templateId: string
) => {
  const result = await entitiesDS.getEntitiesByTemplateId(templateId);
  return result.all();
};

const expectCallbacksForSingleRow = (
  callbacks: ReturnType<typeof createCallbacks>,
  importId: string
) => {
  expect(callbacks.onStart).toHaveBeenCalledWith({ importId });
  expect(callbacks.onProgress).toHaveBeenCalledWith(
    expect.objectContaining({
      importId,
      processedRows: 1,
      totalRows: 1,
      batchIndex: 1,
      batchCount: 1,
      entitiesCreatedInBatch: 1,
    })
  );
  expect(callbacks.onSuccess).toHaveBeenCalledWith({ importId });
};

const expectEntityContent = (entity: Entity) => {
  const translation = entity.getTranslation('en');
  expect(translation.title.value[0].value).toBe('My Title');
  expect(translation.getValue('description').value[0].value).toBe('Some description');
};

describe('CsvImportEntitiesJob (integration)', () => {
  const template = fixtures.templates[0];
  const templateId = template._id.toString();
  const relatedTemplateId = fixtures.templates[1]._id.toString();
  const createdImportIds: string[] = [];

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'csv-import-entities-job');
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await testingEnvironment.setFixtures(fixtures);
    await cleanupCsvV2QueueJobsByImportIds(createdImportIds.splice(0));
    await Promise.all(
      [
        'csv_imports',
        'csv_import_rows',
        'csv_import_row_errors',
        'csv_import_thesauri_values',
        'csv_import_relationships_values',
        'entities',
        'files',
      ].map(async collectionName => {
        const collection = testingEnvironment.db.getCollection(collectionName);
        if (collection) {
          await collection.deleteMany({});
        }
      })
    );
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create entities from staged rows and update stats', async () => {
    const { useCase, csvImportsDS, rowsDS, rowErrorsDS, entitiesDS } = buildUseCase();
    const importId = fixturesFactory.idString('import-entities-basic');
    createdImportIds.push(importId);
    const userId = fixturesFactory.idString('import-entities-user');

    const { callbacks, updatedImport, rowErrorsCount } = await runSingleRowImport({
      useCase,
      csvImportsDS,
      rowsDS,
      rowErrorsDS,
      importId,
      templateId,
      userId,
    });

    expectCallbacksForSingleRow(callbacks, importId);
    expectImportState(updatedImport);
    expect(rowErrorsCount).toBe(0);

    const entities = await fetchEntitiesByTemplate(entitiesDS, templateId);
    expect(entities).toHaveLength(1);
    expectEntityContent(entities[0]);
  });

  it('should import rows with any-template relationship when there is a unique match', async () => {
    const { useCase, csvImportsDS, rowsDS, rowErrorsDS, entitiesDS, jobsDispatcher } =
      buildUseCase();
    const importId = fixturesFactory.idString('import-entities-any-relationship');
    createdImportIds.push(importId);
    const userId = fixturesFactory.idString('import-entities-any-user');
    const relatedSharedId = fixturesFactory.idString('related-any-shared');

    await testingEnvironment.db.getCollection('entities')!.insertMany([
      {
        _id: fixturesFactory.id('related-any-en'),
        sharedId: relatedSharedId,
        title: 'Related Any',
        language: 'en',
        template: fixtures.templates[1]._id,
        metadata: {},
        user: fixturesFactory.id('import-entities-any-user'),
        creationDate: Date.now(),
        editDate: Date.now(),
        published: false,
      },
      {
        _id: fixturesFactory.id('related-any-es'),
        sharedId: relatedSharedId,
        title: 'Related Any',
        language: 'es',
        template: fixtures.templates[1]._id,
        metadata: {},
        user: fixturesFactory.id('import-entities-any-user'),
        creationDate: Date.now(),
        editDate: Date.now(),
        published: false,
      },
    ]);

    await testingEnvironment.db.getCollection('csv_import_relationships_values')!.insertOne({
      importId,
      templateId: '',
      values: [
        {
          label: 'Related Any',
          matches: [{ sharedId: relatedSharedId, templateId: relatedTemplateId }],
        },
      ],
      createdAt: Date.now(),
    });

    await insertImport(csvImportsDS, {
      importId,
      templateId,
      userId,
    });
    await stageRows(rowsDS, {
      importId,
      csv: 'title,description,rel_any\nMy Title,Some description,Related Any',
    });

    const callbacks = createCallbacks();
    await useCase.execute({ importId, callbacks });
    const updatedImport = (await csvImportsDS.getById(importId)).getDataOrThrow();
    const rowErrorsCount = await rowErrorsDS.countByImport(importId);

    expectCallbacksForSingleRow(callbacks, importId);
    expectImportState(updatedImport);
    expect(rowErrorsCount).toBe(0);

    const entities = await fetchEntitiesByTemplate(entitiesDS, templateId);
    expect(entities).toHaveLength(1);
    const translation = entities[0].getTranslation('en');
    expect(translation.getValue('rel_any').value).toEqual([
      expect.objectContaining({ value: relatedSharedId }),
    ]);
    expect(jobsDispatcher.dispatch).toHaveBeenCalledWith(
      RelationshipSyncJob,
      expect.objectContaining({
        tenantName: tenants.current().name,
        userId,
        templateId,
        targetLanguage: 'en',
        sharedId: expect.any(String),
      })
    );
  });

  it('should import rows with multiple any-template relationships separated by pipe', async () => {
    const { useCase, csvImportsDS, rowsDS, rowErrorsDS, entitiesDS } = buildUseCase();
    const importId = fixturesFactory.idString('import-entities-any-relationship-multi');
    createdImportIds.push(importId);
    const userId = fixturesFactory.idString('import-entities-any-multi-user');
    const relatedSharedIdA = fixturesFactory.idString('related-any-shared-a');
    const relatedSharedIdB = fixturesFactory.idString('related-any-shared-b');

    await testingEnvironment.db.getCollection('entities')!.insertMany([
      {
        _id: fixturesFactory.id('related-any-a-en'),
        sharedId: relatedSharedIdA,
        title: 'Related Any A',
        language: 'en',
        template: fixtures.templates[1]._id,
        metadata: {},
        user: fixturesFactory.id('import-entities-any-multi-user'),
        creationDate: Date.now(),
        editDate: Date.now(),
        published: false,
      },
      {
        _id: fixturesFactory.id('related-any-a-es'),
        sharedId: relatedSharedIdA,
        title: 'Related Any A',
        language: 'es',
        template: fixtures.templates[1]._id,
        metadata: {},
        user: fixturesFactory.id('import-entities-any-multi-user'),
        creationDate: Date.now(),
        editDate: Date.now(),
        published: false,
      },
      {
        _id: fixturesFactory.id('related-any-b-en'),
        sharedId: relatedSharedIdB,
        title: 'Related Any B',
        language: 'en',
        template: fixtures.templates[1]._id,
        metadata: {},
        user: fixturesFactory.id('import-entities-any-multi-user'),
        creationDate: Date.now(),
        editDate: Date.now(),
        published: false,
      },
      {
        _id: fixturesFactory.id('related-any-b-es'),
        sharedId: relatedSharedIdB,
        title: 'Related Any B',
        language: 'es',
        template: fixtures.templates[1]._id,
        metadata: {},
        user: fixturesFactory.id('import-entities-any-multi-user'),
        creationDate: Date.now(),
        editDate: Date.now(),
        published: false,
      },
    ]);

    await testingEnvironment.db.getCollection('csv_import_relationships_values')!.insertOne({
      importId,
      templateId: '',
      values: [
        {
          label: 'Related Any A',
          matches: [{ sharedId: relatedSharedIdA, templateId: relatedTemplateId }],
        },
        {
          label: 'Related Any B',
          matches: [{ sharedId: relatedSharedIdB, templateId: relatedTemplateId }],
        },
      ],
      createdAt: Date.now(),
    });

    await insertImport(csvImportsDS, {
      importId,
      templateId,
      userId,
    });
    await stageRows(rowsDS, {
      importId,
      csv: 'title,description,rel_any\nMy Title,Some description,Related Any A|Related Any B',
    });

    const callbacks = createCallbacks();
    await useCase.execute({ importId, callbacks });
    const updatedImport = (await csvImportsDS.getById(importId)).getDataOrThrow();
    const rowErrorsCount = await rowErrorsDS.countByImport(importId);

    expectCallbacksForSingleRow(callbacks, importId);
    expectImportState(updatedImport);
    expect(rowErrorsCount).toBe(0);

    const entities = await fetchEntitiesByTemplate(entitiesDS, templateId);
    expect(entities).toHaveLength(1);
    const translation = entities[0].getTranslation('en');
    expect(translation.getValue('rel_any').value).toEqual([
      expect.objectContaining({ value: relatedSharedIdA }),
      expect.objectContaining({ value: relatedSharedIdB }),
    ]);
  });

  it('preserves completed batch progress when cancelled before finalization', async () => {
    const { useCase, csvImportsDS, rowsDS, rowErrorsDS } = buildUseCase();
    const importId = fixturesFactory.idString('import-entities-cancelled-before-finalize');
    createdImportIds.push(importId);
    const userId = fixturesFactory.idString('import-entities-cancel-user');

    await insertImport(csvImportsDS, {
      importId,
      templateId,
      userId,
    });
    await stageRows(rowsDS, {
      importId,
      csv: 'title,description\nMy Title,Some description',
    });

    const callbacks = createCallbacks();
    callbacks.onProgress.mockImplementation(async () => {
      await csvImportsDS.cancel(importId);
    });

    await useCase.execute({ importId, callbacks });

    const updatedImport = (await csvImportsDS.getById(importId)).getDataOrThrow();
    const rowErrorsCount = await rowErrorsDS.countByImport(importId);

    expect(updatedImport.status).toBe(CsvImportStatus.Cancelled);
    expect(updatedImport.stats).toEqual(
      expect.objectContaining({
        rowsProcessed: 1,
        rowsFailed: 0,
      })
    );
    expect(rowErrorsCount).toBe(0);
    expect(callbacks.onSuccess).not.toHaveBeenCalled();
    expect(callbacks.onError).not.toHaveBeenCalled();
  });

  it('persists relationship taxonomy metadata for failed rows', async () => {
    const { useCase, csvImportsDS, rowsDS, rowErrorsDS } = buildUseCase();
    const importId = fixturesFactory.idString('import-entities-relationship-failure');
    createdImportIds.push(importId);
    const userId = fixturesFactory.idString('import-entities-relationship-failure-user');

    await testingEnvironment.db.getCollection('csv_import_relationships_values')!.insertOne({
      importId,
      templateId: '',
      values: [],
      createdAt: Date.now(),
    });

    await insertImport(csvImportsDS, {
      importId,
      templateId,
      userId,
    });
    await stageRows(rowsDS, {
      importId,
      csv: 'title,description,rel_any\nMy Title,Some description,Unknown Related',
    });

    const callbacks = createCallbacks();
    await useCase.execute({ importId, callbacks });

    const persistedErrors = await rowErrorsDS.getByImport(importId);
    expect(persistedErrors).toHaveLength(1);

    const [error] = persistedErrors;
    expect(error.code).toBe(RowErrorCode.RelationshipNotFound);
    expect(error.message).toBe('Relationship value could not be resolved to an existing entity.');
    expect(error.property).toBe('rel_any');
    expect(error.rawValue).toBe('Unknown Related');
    expect(error.details).toEqual({
      unresolved: [
        {
          token: 'Unknown Related',
          reason: 'not_found',
          scope: 'any-template',
          candidates: null,
        },
      ],
    });
  });
});
