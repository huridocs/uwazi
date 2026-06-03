/* eslint-disable max-statements */
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import { ThesauriService } from '#api/core/application/ThesauriService.js';
import { ThesaurusTranslationService } from '#api/core/application/thesaurusTranslationService/ThesaurusTranslationService.js';
import { DispatcherAdapter } from '#api/core/infrastructure/jobs/DispatcherAdapter.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { PendingThesauriValuesApplier } from '../PendingThesauriValuesApplier.js';
import { CsvImportThesauriValues } from '../../../domain/CsvImportThesauriValues.js';
import { CsvThesauriPendingEntry } from '../../../domain/CsvThesauriPendingValues.js';

const fixturesFactory = getFixturesFactory();

const fixtures = {
  settings: [
    {
      _id: fixturesFactory.id('pendingThesauriSettings'),
      languages: [
        { key: 'en' as LanguageISO6391, label: 'English', default: true },
        { key: 'es' as LanguageISO6391, label: 'Spanish' },
      ],
      features: { newNameGeneration: false },
    },
  ],
  dictionaries: [fixturesFactory.thesauri('applier-thesaurus', [])],
};

const buildPendingDoc = ({
  importId,
  thesaurusId,
  rootLabel,
  childLabel,
}: {
  importId: string;
  thesaurusId: string;
  rootLabel: string;
  childLabel?: string;
}) => {
  const entry = new CsvThesauriPendingEntry({
    propertyId: 'prop-id',
    propertyName: 'prop-name',
    thesaurusId,
    type: 'select',
  });
  const root = entry.ensureRoot({
    label: rootLabel,
    normalized: rootLabel.toLowerCase(),
    languages: { en: rootLabel },
  });
  if (childLabel) {
    root.ensureChild({
      label: childLabel,
      normalized: childLabel.toLowerCase(),
      languages: { en: childLabel },
    });
  }
  return CsvImportThesauriValues.create({
    importId,
    thesaurusId,
    createdAt: Date.now(),
    entries: [entry],
  });
};

describe('PendingThesauriValuesApplier', () => {
  const thesaurusId = fixtures.dictionaries[0]._id.toString();

  const buildApplier = () =>
    testingEnvironment.runWithContext(() => {
      const transactionManager = TransactionManagerFactory.default();
      const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });
      const translationsDS = DefaultTranslationsDataSource(transactionManager);
      const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
      const thesauriService = new ThesauriService({
        dispatcher: new DispatcherAdapter(
          DefaultDispatcher(tenants.current().name, transactionManager)
        ),
        thesauriDS,
        thesaurusTranslationService: new ThesaurusTranslationService({
          settingsDS,
          translationsDS,
        }),
      });
      return new PendingThesauriValuesApplier({
        thesauriDS,
        thesauriService,
      });
    });

  const replaceThesaurusValues = async (
    values: Array<{ id: string; label: string; values?: Array<{ id: string; label: string }> }>
  ) =>
    testingEnvironment.runWithContext(async () => {
      const transactionManager = TransactionManagerFactory.default();
      const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });
      const current = (await thesauriDS.getById(thesaurusId)).getDataOrThrow();
      const updated = new Thesaurus({
        id: current.id,
        name: current.name,
        values,
      });
      await thesauriDS.update(updated);
    });

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'pending-thesauri-values-applier');
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await testingEnvironment.setFixtures(fixtures);
    await Promise.all(
      ['translations_v2'].map(async collectionName => {
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

  it('should include existing IDs in appliedValues when no appends are needed', async () => {
    await replaceThesaurusValues([
      {
        id: fixturesFactory.idString('root-id'),
        label: 'Root',
        values: [{ id: fixturesFactory.idString('child-id'), label: 'Child' }],
      },
    ]);

    const applier = await buildApplier();

    const pendingDoc = buildPendingDoc({
      importId: 'imp-1',
      thesaurusId,
      rootLabel: 'Root',
      childLabel: 'Child',
    });

    const { diff, appliedValues } = await applier.apply(pendingDoc, {
      tenantName: tenants.current().name,
      userId: fixturesFactory.idString('pending-thesauri-user'),
    });

    expect(diff.valuesToAppend).toHaveLength(0);
    expect(appliedValues).toEqual(
      expect.arrayContaining([
        { label: 'Root', valueId: fixturesFactory.idString('root-id') },
        {
          label: 'Child',
          parentLabel: 'Root',
          valueId: fixturesFactory.idString('child-id'),
        },
      ])
    );
  });

  it('should capture newly appended IDs in appliedValues', async () => {
    await replaceThesaurusValues([]);
    const applier = await buildApplier();

    const pendingDoc = buildPendingDoc({
      importId: 'imp-2',
      thesaurusId,
      rootLabel: 'New Root',
      childLabel: 'New Child',
    });

    const { diff, appliedValues } = await applier.apply(pendingDoc, {
      tenantName: tenants.current().name,
      userId: fixturesFactory.idString('pending-thesauri-user'),
    });

    expect(diff.valuesToAppend.length).toBeGreaterThan(0);
    expect(appliedValues).toHaveLength(2);
    const translationsDS = DefaultTranslationsDataSource(TransactionManagerFactory.default());
    const translations = await translationsDS.getByContext(thesaurusId).all();
    expect(translations.length).toBeGreaterThan(0);
    expect(appliedValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'New Root',
          valueId: expect.any(String),
        }),
        expect.objectContaining({
          label: 'New Child',
          parentLabel: 'New Root',
          valueId: expect.any(String),
        }),
      ])
    );
  });
  it('should include existing and new values together', async () => {
    await replaceThesaurusValues([
      {
        id: fixturesFactory.idString('existing-root-id'),
        label: 'Root',
        values: [
          {
            id: fixturesFactory.idString('existing-child-id'),
            label: 'Existing Child',
          },
        ],
      },
      {
        id: fixturesFactory.idString('standalone-id'),
        label: 'Standalone Existing',
      },
    ]);

    const applier = await buildApplier();

    const entry = new CsvThesauriPendingEntry({
      propertyId: 'prop-id',
      propertyName: 'prop-name',
      thesaurusId,
      type: 'select',
    });
    const root = entry.ensureRoot({
      label: 'Root',
      normalized: 'root',
      languages: { en: 'Root' },
    });
    root.ensureChild({
      label: 'Existing Child',
      normalized: 'existing child',
      languages: { en: 'Existing Child' },
    });
    root.ensureChild({
      label: 'New Child',
      normalized: 'new child',
      languages: { en: 'New Child' },
    });

    const standalone = entry.ensureRoot({
      label: 'Standalone Existing',
      normalized: 'standalone existing',
      languages: { en: 'Standalone Existing' },
    });
    standalone.ensureChild({
      label: 'New Standalone Child',
      normalized: 'new standalone child',
      languages: { en: 'New Standalone Child' },
    });

    entry.ensureRoot({
      label: 'New Standalone Root',
      normalized: 'new standalone root',
      languages: { en: 'New Standalone Root' },
    });

    const pendingDoc = CsvImportThesauriValues.create({
      importId: 'imp-3',
      thesaurusId,
      createdAt: Date.now(),
      entries: [entry],
    });

    const { diff, appliedValues } = await applier.apply(pendingDoc, {
      tenantName: tenants.current().name,
      userId: fixturesFactory.idString('pending-thesauri-user'),
    });

    expect(diff.valuesToAppend.length).toBeGreaterThan(0);
    expect(diff.valuesToAppend).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Root',
          values: expect.arrayContaining([expect.objectContaining({ label: 'New Child' })]),
        }),
        expect.objectContaining({
          label: 'Standalone Existing',
          values: expect.arrayContaining([
            expect.objectContaining({ label: 'New Standalone Child' }),
          ]),
        }),
        expect.objectContaining({
          label: 'New Standalone Root',
        }),
      ])
    );
    expect(appliedValues).toEqual(
      expect.arrayContaining([
        {
          label: 'Root',
          valueId: fixturesFactory.idString('existing-root-id'),
        },
        {
          label: 'Existing Child',
          parentLabel: 'Root',
          valueId: fixturesFactory.idString('existing-child-id'),
        },
        { label: 'Standalone Existing', valueId: fixturesFactory.idString('standalone-id') },
        expect.objectContaining({
          label: 'New Child',
          parentLabel: 'Root',
          valueId: expect.any(String),
        }),
        expect.objectContaining({
          label: 'New Standalone Child',
          parentLabel: 'Standalone Existing',
          valueId: expect.any(String),
        }),
        expect.objectContaining({
          label: 'New Standalone Root',
          valueId: expect.any(String),
        }),
      ])
    );
  });
});
