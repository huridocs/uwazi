/* eslint-disable max-statements */
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { CsvImportDomain, CsvImportStatus } from '../../../domain/CsvImport.js';
import { CsvThesauriPendingEntry } from '../../../domain/CsvThesauriPendingValues.js';
import { CsvImportThesauriValues } from '../../../domain/CsvImportThesauriValues.js';
import { CsvCreateThesauriValuesJobFactory } from '../../../infrastructure/factories/CsvCreateThesauriValuesJobFactory.js';
import { cleanupCsvV2QueueJobsByImportIds } from '../../../specs/helpers/queueTestCleanup.js';

const fixturesFactory = getFixturesFactory();

const fixtures = {
  settings: [
    {
      _id: fixturesFactory.id('csvCreateThesauriSettings'),
      languages: [
        { key: 'en' as LanguageISO6391, label: 'English', default: true },
        { key: 'es' as LanguageISO6391, label: 'Spanish' },
      ],
      features: { newNameGeneration: false },
    },
  ],
  templates: [fixturesFactory.template('csvCreateThesauriTemplate', [])],
  dictionaries: [fixturesFactory.thesauri('csvCreateThesaurus', [])],
};

const createCallbacks = () => ({
  onStart: jest.fn(),
  onProgress: jest.fn(),
  onSuccess: jest.fn(),
  onError: jest.fn(),
});

describe('CsvCreateThesauriValuesJob (integration)', () => {
  const thesaurusId = fixtures.dictionaries[0]._id.toString();
  const templateId = fixtures.templates[0]._id.toString();
  const createdImportIds: string[] = [];

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'csv-create-thesauri-values-job');
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await testingEnvironment.setFixtures(fixtures);
    await cleanupCsvV2QueueJobsByImportIds(createdImportIds.splice(0));
    await Promise.all(
      ['csv_imports', 'csv_import_thesauri_values', 'translations_v2'].map(async collectionName => {
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

  it('should append missing values, update translations, and persist stats', async () => {
    const jobsDispatcher: jest.Mocked<JobsDispatcher> = TestUtils.mockClass<JobsDispatcher>({
      dispatch: jest.fn().mockResolvedValue(undefined),
      dispatchMany: jest.fn().mockResolvedValue(undefined),
    }) as jest.Mocked<JobsDispatcher>;
    const { useCase, csvImportsDS, thesauriValuesDS } = CsvCreateThesauriValuesJobFactory.build({
      jobsDispatcher,
    });
    const importId = fixturesFactory.idString('create-thesauri-import');
    createdImportIds.push(importId);
    const userId = fixturesFactory.idString('create-thesauri-user');
    const tenantName = tenants.current().name;

    const csvImport = CsvImportDomain.withStorage(
      CsvImportDomain.create({
        id: importId,
        templateId,
        file: { originalName: 'file.csv', mimeType: 'text/csv', size: 10 },
        createdBy: userId,
      }),
      `csv-imports/${importId}/original.csv`
    );
    await csvImportsDS.insert(csvImport);

    const entry = new CsvThesauriPendingEntry({
      propertyId: 'prop',
      propertyName: 'Property',
      thesaurusId,
      type: 'select',
    });
    const root = entry.ensureRoot({
      label: 'Country',
      normalized: 'country',
      languages: { en: 'Country', es: 'País' },
    });
    root.ensureChild({
      label: 'Country::City',
      normalized: 'country::city',
      languages: { en: 'City', es: 'Ciudad' },
    });

    await thesauriValuesDS.replacePendingValues(importId, [
      CsvImportThesauriValues.create({
        importId,
        thesaurusId,
        createdAt: Date.now(),
        entries: [entry],
      }),
    ]);

    const callbacks = createCallbacks();
    await useCase.execute({
      importId,
      tenantName,
      userId,
      callbacks,
    });

    const updatedImport = (await csvImportsDS.getById(importId)).getDataOrThrow();
    expect(updatedImport.status).toBe(CsvImportStatus.PreflightThesauriCreateDone);
    expect(updatedImport.stats).toEqual(
      expect.objectContaining({
        thesaurusValuesCreated: 2,
        thesaurusValuesObserved: 2,
        thesauriTouched: 1,
      })
    );

    const updatedPendingDocs = await thesauriValuesDS.getByImport(importId);
    expect(updatedPendingDocs).toHaveLength(1);
    expect(updatedPendingDocs[0].appliedValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Country', valueId: expect.any(String) }),
        expect.objectContaining({
          label: 'Country::City',
          parentLabel: 'Country',
          valueId: expect.any(String),
        }),
      ])
    );
    expect(updatedPendingDocs[0].stats).toEqual(
      expect.objectContaining({
        valuesCreated: 2,
        valuesObserved: 2,
      })
    );
    expect(callbacks.onSuccess).toHaveBeenCalledWith({ importId });
  });
});
