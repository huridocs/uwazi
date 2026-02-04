import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { FileSystemStorage } from 'api/core/infrastructure/files/FileSystemStorage';
import { PathManager } from 'api/core/infrastructure/files/PathManager';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { tenants } from 'api/tenants/tenantContext';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Entity } from 'api/core/domain/entity/Entity';
import { CsvImportDomain, CsvImportStatus } from '../../../domain/CsvImport';
import { CsvImportRow } from '../../../domain/CsvImportRow';
import { CsvImportEntitiesJob } from '../CsvImportEntitiesJob';
import { CsvImportEntitiesJobFactory } from '../../../infrastructure/factories/CsvImportEntitiesJobFactory';

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
      index,
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
  const { useCase, csvImportsDS, rowsDS, rowErrorsDS, entitiesDS } =
    CsvImportEntitiesJobFactory.build({
      transactionManager,
      fileStorage,
      batchSize: 2,
    });

  return { useCase, csvImportsDS, rowsDS, rowErrorsDS, entitiesDS };
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
  entitiesDS: MongoMultiLanguageEntityDataSource,
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

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'csv-import-entities-job');
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await testingEnvironment.setFixtures(fixtures);
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
});
