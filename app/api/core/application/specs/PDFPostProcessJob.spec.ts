import { TestUtils } from '#api/common.v2/utils/Test.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FilesService } from '#api/core/application/FilesService.js';
import { FileBuilder } from '#api/core/domain/files/specs/FileBuilder.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { PDFService } from '#api/core/infrastructure/services/PDFService.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { Result } from '#api/core/libs/Result.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { PDFPostProcessJob } from '../PDFPostProcessJob.js';

const f = getFixturesFactory();

type TestConfig = {
  name: string;
  usePostgres: boolean;
  getDbFile: (id: string) => Promise<Record<string, unknown> | undefined>;
  getAllFrom: (collection: string) => Promise<Record<string, unknown>[]>;
};

const testConfigs: TestConfig[] = [
  {
    name: 'Mongo',
    usePostgres: false,
    getDbFile: async id => {
      const files = await testingEnvironment.db.getAllFrom('files');
      return files.find((file: any) => file._id.toString() === f.idString(id));
    },
    getAllFrom: async collection => testingEnvironment.db.getAllFrom(collection),
  },
  {
    name: 'Postgres',
    usePostgres: true,
    getDbFile: async id => {
      const files = await testingEnvironment.pg.getAllFrom('files');
      return files.find((file: any) => file._id === f.idString(id));
    },
    getAllFrom: async collection => testingEnvironment.db.getAllFrom(collection),
  },
];

const allFixtures: DBFixture = {
  settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
  templates: [f.template('template1')],
  entities: [
    f.entity('ent1', 'template1', {}, { language: 'en' }),
    f.entity('ent1', 'template1', {}, { language: 'es' }),
    f.entity('ent2', 'template1', {}, { language: 'en' }),
    f.entity('ent2', 'template1', {}, { language: 'es' }),
    f.entity('ent3', 'template1', {}, { language: 'en' }),
    f.entity('ent3', 'template1', {}, { language: 'es' }),
  ],
  files: [
    f.file('s1-doc', {
      type: 'document',
      status: 'processing',
      entity: 'ent1',
      language: 'en',
      mimetype: 'application/pdf',
      size: 0,
      creationDate: 0,
    }),
    f.file('s2-doc', {
      type: 'document',
      status: 'processing',
      entity: 'ent2',
      language: 'es',
      mimetype: 'application/pdf',
      size: 0,
      creationDate: 0,
    }),
    f.file('s3-ready-doc', {
      type: 'document',
      status: 'ready',
      entity: 'ent3',
      language: 'en',
      mimetype: 'application/pdf',
      size: 0,
      creationDate: 0,
    }),
    f.file('s3-ready-thumb', {
      type: 'thumbnail',
      entity: 'ent3',
      language: 'en',
      filename: `${f.idString('s3-ready-doc')}.jpg`,
      mimetype: 'image/jpeg',
      size: 0,
      creationDate: 0,
    }),
    f.file('s3-proc-doc', {
      type: 'document',
      status: 'processing',
      entity: 'ent3',
      language: 'es',
      mimetype: 'application/pdf',
      size: 0,
      creationDate: 0,
    }),
  ],
};

const createSut = (
  transactionManager: ReturnType<typeof TransactionManagerFactory.fake>,
  overrides: {
    pdfLanguage: 'en' | 'es';
    thumbnail: ReturnType<typeof FileBuilder.thumbnail>;
  }
) => {
  const pdfService = TestUtils.mockClass<PDFService>({
    extractText: jest.fn().mockResolvedValue(
      Result.ok({
        language: { key: overrides.pdfLanguage as any },
        totalPages: 1,
        pages: async () => ({ 1: 'text' }),
      })
    ),
  });

  const filesService = TestUtils.mockClass<FilesService>({
    createThumbnail: jest.fn().mockResolvedValue(Result.ok(overrides.thumbnail)),
  });

  const fileStorage = TestUtils.mockClass<FileStorage>({ storeFile: jest.fn() });
  const eventBus = TestUtils.mockClass<EventsBus>({ emit: jest.fn() });

  return testingEnvironment.runWithContext(
    () =>
      new PDFPostProcessJob(
        {
          transactionManager,
          filesDS: FilesDataSourceFactory.default(),
          entitiesDS: EntitiesDataSourceFactory.default({ transactionManager }),
          settingsDS: SettingsDataSourceFactory.default({ transactionManager }),
          filesService,
          fileStorage,
          pdfService: pdfService as any,
          eventBus,
        },
        { tenant: { name: 'test' } as any }
      )
  );
};

describe('PDFPostProcessJob - setPreview (real DB)', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres, getAllFrom }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: 'test',
        featureFlags: { postgresFiles: usePostgres },
      });
      await testingEnvironment.setFixtures(allFixtures);
    });

    describe('when processing a document in the default language', () => {
      it('should set preview on all entity translations', async () => {
        const transactionManager = TransactionManagerFactory.fake();

        const thumbnail = FileBuilder.thumbnail('aaaaaaaaaaaaaaaaaaaaaaaa', {
          entity: 'ent1',
          language: 'en',
          filename: `${f.idString('s1-doc')}.jpg`,
        });

        await createSut(transactionManager, { pdfLanguage: 'en', thumbnail }).execute(
          { documentId: f.idString('s1-doc') },
          true
        );

        const entities = await getAllFrom('entities');
        const en = entities.find(e => e.sharedId === 'ent1' && e.language === 'en');
        const es = entities.find(e => e.sharedId === 'ent1' && e.language === 'es');

        expect(en?.preview).toBe(`${f.idString('s1-doc')}.jpg`);
        expect(es?.preview).toBe(`${f.idString('s1-doc')}.jpg`);
      });
    });

    describe('when processing a document in a non-default language', () => {
      it('should set preview using the language-matched thumbnail, falling back to it for other languages', async () => {
        const transactionManager = TransactionManagerFactory.fake();

        const thumbnail = FileBuilder.thumbnail('bbbbbbbbbbbbbbbbbbbbbbbb', {
          entity: 'ent2',
          language: 'es',
          filename: `${f.idString('s2-doc')}.jpg`,
        });

        await createSut(transactionManager, { pdfLanguage: 'es', thumbnail }).execute(
          { documentId: f.idString('s2-doc') },
          true
        );

        const entities = await getAllFrom('entities');
        const en = entities.find(e => e.sharedId === 'ent2' && e.language === 'en');
        const es = entities.find(e => e.sharedId === 'ent2' && e.language === 'es');

        expect(es?.preview).toBe(`${f.idString('s2-doc')}.jpg`);
        expect(en?.preview).toBe(`${f.idString('s2-doc')}.jpg`);
      });
    });

    describe('when each language has its own document with a thumbnail', () => {
      it('should set a different preview per language', async () => {
        const transactionManager = TransactionManagerFactory.fake();

        const esThumbnail = FileBuilder.thumbnail('cccccccccccccccccccccccc', {
          entity: 'ent3',
          language: 'es',
          filename: `${f.idString('s3-proc-doc')}.jpg`,
        });

        await createSut(transactionManager, { pdfLanguage: 'es', thumbnail: esThumbnail }).execute(
          { documentId: f.idString('s3-proc-doc') },
          true
        );

        const entities = await getAllFrom('entities');
        const en = entities.find(e => e.sharedId === 'ent3' && e.language === 'en');
        const es = entities.find(e => e.sharedId === 'ent3' && e.language === 'es');

        expect(en?.preview).toBe(`${f.idString('s3-ready-doc')}.jpg`);
        expect(es?.preview).toBe(`${f.idString('s3-proc-doc')}.jpg`);
      });
    });
  });
});
