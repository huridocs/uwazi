/* eslint-disable max-statements, max-lines, max-classes-per-file */
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { CsvCreateThesauriValuesJobHandler } from '../../../infrastructure/jobHandlers/CsvCreateThesauriValuesJobHandler.js';
import { CsvImportDomain, CsvImportStatus } from '../../../domain/CsvImport.js';
import { CsvImportRow } from '../../../domain/CsvImportRow.js';
import { CsvPreflightJobFactory } from '../../../infrastructure/factories/CsvPreflightJobFactory.js';
import { cleanupCsvV2QueueJobsByImportIds } from '../../../specs/helpers/queueTestCleanup.js';
import {
  applyCsvJobBackendFlags,
  clearCsvStores,
  csvJobBackendConfigs,
  itWithContext,
} from '../../../specs/csvBackendTest.js';

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
      id: fixturesFactory.idString(`${params.importId}-row-${index}`),
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
  const jobsDispatcher: jest.Mocked<JobsDispatcher> = TestUtils.mockClass<JobsDispatcher>({
    dispatch: jest.fn().mockResolvedValue(undefined),
    dispatchMany: jest.fn().mockResolvedValue(undefined),
  }) as jest.Mocked<JobsDispatcher>;
  const { useCase, csvImportsDS, rowsDS, thesauriValuesDS, relationshipPendingValuesDS } =
    CsvPreflightJobFactory.build({
      jobsDispatcher,
    });
  return {
    useCase,
    csvImportsDS,
    rowsDS,
    thesauriValuesDS,
    relationshipPendingValuesDS,
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
  const [template] = fixtures.templates;
  const templateId = template._id.toString();
  const selectPropertyId = template
    .properties!.find(property => property.name === 'select_property')!
    ._id!.toString();
  const relatedTemplateId = fixtures.templates[1]._id.toString();
  const thesaurusId = fixtures.dictionaries![0]!._id.toString();
  const createdImportIds: string[] = [];

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(csvJobBackendConfigs)('$name', ({ postgresCsv, postgresCore }) => {
    beforeEach(async () => {
      applyCsvJobBackendFlags(postgresCsv, postgresCore);
      jest.clearAllMocks();
      await testingEnvironment.setFixtures(fixtures);
      await cleanupCsvV2QueueJobsByImportIds(createdImportIds.splice(0));
      await clearCsvStores();
    });

    itWithContext('persists pending thesauri values and dispatches the creation job', async () => {
      const {
        useCase,
        csvImportsDS,
        rowsDS,
        thesauriValuesDS,
        jobsDispatcher,
        relationshipPendingValuesDS,
      } = buildUseCase();
      const importId = fixturesFactory.idString('preflight-happy-import');
      createdImportIds.push(importId);
      const userId = fixturesFactory.idString('preflight-happy-user');
      const tenantName = tenants.current().name;

      await insertImport(csvImportsDS, { importId, templateId, userId });
      await stageRows(rowsDS, {
        importId,
        csv: 'title,select_property__en,select_property__es,rel_property\nrow,New Value,Nuevo Valor,Related 1|Related 2',
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
      const pendingRelationships = await relationshipPendingValuesDS.getByImport(importId);
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

    itWithContext(
      'aggregates duplicates, trims values, and preserves nested children translations',
      async () => {
        const { useCase, csvImportsDS, rowsDS, thesauriValuesDS } = buildUseCase();
        const importId = fixturesFactory.idString('preflight-trim-import');
        createdImportIds.push(importId);
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
        const [pendingDoc] = pendingDocs;
        const [entry] = pendingDoc.entries;
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
      }
    );

    itWithContext(
      'records issues from the pending values builder and marks the import as failed',
      async () => {
        const { useCase, csvImportsDS, rowsDS } = buildUseCase();
        const importId = fixturesFactory.idString('preflight-issues-import');
        createdImportIds.push(importId);
        const userId = fixturesFactory.idString('preflight-issues-user');
        const tenantName = tenants.current().name;

        await insertImport(csvImportsDS, { importId, templateId, userId });
        await stageRows(rowsDS, {
          importId,
          csv: 'title,select_property__en,select_property__es\nrow,"Parent::Child::Extra",Valor',
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
      }
    );

    itWithContext(
      'raises header validation errors when the default language column is missing',
      async () => {
        const { useCase, csvImportsDS, rowsDS } = buildUseCase();
        const importId = fixturesFactory.idString('preflight-headers-import');
        createdImportIds.push(importId);
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
      }
    );

    itWithContext(
      'raises header validation errors when language-suffixed columns omit an instance language',
      async () => {
        await testingEnvironment.setFixtures({
          ...fixtures,
          settings: [
            {
              ...fixtures.settings[0],
              languages: [
                { key: 'en' as LanguageISO6391, label: 'English', default: true },
                { key: 'es' as LanguageISO6391, label: 'Spanish' },
                { key: 'fr' as LanguageISO6391, label: 'French' },
              ],
            },
          ],
        });

        const { useCase, csvImportsDS, rowsDS } = buildUseCase();
        const importId = fixturesFactory.idString('preflight-missing-language-column');
        createdImportIds.push(importId);
        const userId = fixturesFactory.idString('preflight-missing-language-column-user');
        const tenantName = tenants.current().name;

        await insertImport(csvImportsDS, { importId, templateId, userId });
        await stageRows(rowsDS, {
          importId,
          csv: 'title__en,title__es\nTitle EN,Title ES',
        });

        const callbacks = createCallbacks();
        await expect(useCase.execute({ importId, tenantName, userId, callbacks })).rejects.toThrow(
          'Header validation failed'
        );

        const failedImport = (await csvImportsDS.getById(importId)).getDataOrThrow();
        expect(failedImport.status).toBe(CsvImportStatus.Failed);
        expect(failedImport.failure).toEqual(
          expect.objectContaining({
            code: 'HEADER_VALIDATION_FAILED',
            message: 'Header validation failed',
            retryable: false,
            issues: expect.arrayContaining([
              expect.objectContaining({
                reason: 'MissingLanguageColumn',
                property: 'title',
                columns: expect.arrayContaining(['fr']),
              }),
            ]),
          })
        );
      }
    );
  });
});
