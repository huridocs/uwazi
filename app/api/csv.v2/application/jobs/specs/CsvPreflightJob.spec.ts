/* eslint-disable max-statements, max-classes-per-file */
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { tenants } from 'api/tenants/tenantContext';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { TestUtils } from 'api/common.v2/utils/Test';
import { CsvCreateThesauriValuesJobHandler } from '../../../infrastructure/jobHandlers/CsvCreateThesauriValuesJobHandler';
import { CsvImportDomain, CsvImportStatus } from '../../../domain/CsvImport';
import { CsvImportRow } from '../../../domain/CsvImportRow';
import { CsvPreflightJobFactory } from '../../../infrastructure/factories/CsvPreflightJobFactory';

const fixturesFactory = getFixturesFactory();

const createCallbacks = () => ({
  onStart: jest.fn(),
  onSuccess: jest.fn(),
  onError: jest.fn(),
  onProgress: jest.fn(),
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
  const jobsDispatcher: jest.Mocked<JobsDispatcher> = TestUtils.mockClass<JobsDispatcher>({
    dispatch: jest.fn().mockResolvedValue(undefined),
    dispatchMany: jest.fn().mockResolvedValue(undefined),
  }) as jest.Mocked<JobsDispatcher>;
  const { useCase, csvImportsDS, rowsDS, thesauriValuesDS } = CsvPreflightJobFactory.build({
    transactionManager,
    jobsDispatcher,
  });
  return {
    useCase,
    csvImportsDS,
    rowsDS,
    thesauriValuesDS,
    jobsDispatcher,
  };
};

const fixtures = {
  settings: [
    {
      _id: fixturesFactory.id('preflightSettings'),
      languages: [
        { key: 'en' as LanguageISO6391, label: 'English', default: true },
        { key: 'es' as LanguageISO6391, label: 'Spanish' },
      ],
      features: { newNameGeneration: false },
    },
  ],
  dictionaries: [fixturesFactory.thesauri('preflightThesaurus', [])],
  templates: [
    fixturesFactory.template('preflightTemplate', [
      fixturesFactory.property('select_property', 'select', {
        content: fixturesFactory.id('preflightThesaurus').toString(),
      }),
      fixturesFactory.property('rel_property', 'relationship', {
        content: fixturesFactory.id('relatedTemplate').toString(),
      }),
    ]),
    fixturesFactory.template('relatedTemplate', []),
  ],
};

describe('CsvPreflightJob (integration)', () => {
  const template = fixtures.templates[0];
  const templateId = template._id.toString();
  const selectPropertyId =
    template.properties!.find(property => property.name === 'select_property')!._id!.toString();
  const relatedTemplateId = fixtures.templates[1]._id.toString();
  const thesaurusId = fixtures.dictionaries![0]!._id.toString();

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'csv-preflight-job');
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await testingEnvironment.setFixtures(fixtures);
    await Promise.all(
      [
        'csv_imports',
        'csv_import_rows',
        'csv_import_thesauri_values',
        'csv_import_relationships_pending_values',
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

  it('persists pending thesauri values and dispatches the creation job', async () => {
    const { useCase, csvImportsDS, rowsDS, thesauriValuesDS, jobsDispatcher } = buildUseCase();
    const importId = fixturesFactory.idString('preflight-happy-import');
    const userId = fixturesFactory.idString('preflight-happy-user');
    const tenantName = tenants.current().name;

    await insertImport(csvImportsDS, { importId, templateId, userId });
    await stageRows(rowsDS, {
      importId,
      csv:
        'title,select_property__en,select_property__es,rel_property\nrow,New Value,Nuevo Valor,Related 1|Related 2',
    });

    const callbacks = createCallbacks();
    const result = await useCase.execute({ importId, tenantName, userId, callbacks });

    expect(result).toEqual({
      importId,
      status: CsvImportStatus.PreflightScanDone,
    });
    expect(callbacks.onStart).toHaveBeenCalledWith({ importId });
    expect(callbacks.onSuccess).toHaveBeenCalledWith({ importId });

    const updatedImport = (await csvImportsDS.getById(importId)).getDataOrThrow();
    expect(updatedImport.status).toBe(CsvImportStatus.PreflightScanDone);
    const pendingDocs = await thesauriValuesDS.getByImport(importId);
    expect(pendingDocs).toHaveLength(1);
    expect(pendingDocs[0]).toEqual(
      expect.objectContaining({
        importId,
        thesaurusId,
        entries: [
          expect.objectContaining({
            propertyId: selectPropertyId,
            roots: [
              expect.objectContaining({
                label: 'New Value',
                languages: expect.objectContaining({ en: 'New Value', es: 'Nuevo Valor' }),
              }),
            ],
          }),
        ],
      })
    );
    const pendingRelationships = await testingEnvironment.db
      .getCollection('csv_import_relationships_pending_values')!
      .find({ importId })
      .toArray();
    expect(pendingRelationships).toEqual([
      expect.objectContaining({
        importId,
        templateId: relatedTemplateId,
        titles: ['Related 1', 'Related 2'],
      }),
    ]);
    expect(callbacks.onProgress).toHaveBeenCalled();
    expect(jobsDispatcher.dispatch).toHaveBeenCalledWith(
      CsvCreateThesauriValuesJobHandler,
      expect.objectContaining({ importId, tenantName, userId })
    );
  });

  it('aggregates duplicates, trims values, and preserves nested children translations', async () => {
    const { useCase, csvImportsDS, rowsDS, thesauriValuesDS } = buildUseCase();
    const importId = fixturesFactory.idString('preflight-trim-import');
    const userId = fixturesFactory.idString('preflight-trim-user');
    const tenantName = tenants.current().name;

    await insertImport(csvImportsDS, { importId, templateId, userId });
    await stageRows(rowsDS, {
      importId,
      csv: [
        'title,select_property__en,select_property__es',
        'row-1,"Parent","Padre"',
        'row-2,"Parent::Child","Padre::Hijo"',
        'row-3,"  Parent  ","  Padre  "',
      ].join('\n'),
    });

    await useCase.execute({ importId, tenantName, userId, callbacks: createCallbacks() });

    const pendingDocs = await thesauriValuesDS.getByImport(importId);
    expect(pendingDocs).toHaveLength(1);
    const entry = pendingDocs[0].entries[0];
    expect(entry.roots).toHaveLength(1);
    expect(entry.roots[0]).toEqual(
      expect.objectContaining({
        label: 'Parent',
        languages: expect.objectContaining({ en: 'Parent', es: 'Padre' }),
        children: [
          expect.objectContaining({
            label: 'Child',
            languages: expect.objectContaining({ en: 'Child', es: 'Hijo' }),
          }),
        ],
      })
    );
  });

  it('records issues from the pending values builder and marks the import as failed', async () => {
    const { useCase, csvImportsDS, rowsDS } = buildUseCase();
    const importId = fixturesFactory.idString('preflight-issues-import');
    const userId = fixturesFactory.idString('preflight-issues-user');
    const tenantName = tenants.current().name;

    await insertImport(csvImportsDS, { importId, templateId, userId });
    await stageRows(rowsDS, {
      importId,
      csv: 'title,select_property__en\nrow,"Parent::Child::Extra"',
    });

    const callbacks = createCallbacks();
    await expect(useCase.execute({ importId, tenantName, userId, callbacks })).rejects.toThrow(
      'Thesauri values contain errors'
    );

    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.objectContaining({
        importId,
        error: expect.any(Error),
      })
    );

    const failedImport = (await csvImportsDS.getById(importId)).getDataOrThrow();
    expect(failedImport.status).toBe(CsvImportStatus.Failed);
    expect(failedImport.failure).toEqual(
      expect.objectContaining({
        code: 'THESAURI_VALUES_INVALID',
        stage: 'preflight:preparation:thesauri',
        retryable: false,
      })
    );
  });

  it('raises header validation errors when the default language column is missing', async () => {
    const { useCase, csvImportsDS, rowsDS } = buildUseCase();
    const importId = fixturesFactory.idString('preflight-headers-import');
    const userId = fixturesFactory.idString('preflight-headers-user');
    const tenantName = tenants.current().name;

    await insertImport(csvImportsDS, { importId, templateId, userId });
    await stageRows(rowsDS, {
      importId,
      csv: 'title,select_property__es\nrow,Nuevo Valor',
    });

    const callbacks = createCallbacks();
    await expect(useCase.execute({ importId, tenantName, userId, callbacks })).rejects.toThrow(
      'Header validation failed'
    );

    const failedImport = (await csvImportsDS.getById(importId)).getDataOrThrow();
    expect(failedImport.status).toBe(CsvImportStatus.Failed);
    expect(failedImport.failure).toEqual(
      expect.objectContaining({
        message: 'Header validation failed',
        retryable: false,
      })
    );
    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.objectContaining({ importId, error: expect.any(Error) })
    );
  });
});
