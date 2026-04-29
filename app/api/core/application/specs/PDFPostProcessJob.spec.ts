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
import { PDFPostProcessJob } from '../PDFPostProcessJob.js';

const f = getFixturesFactory();

const baseFixtures: DBFixture = {
  settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
  templates: [f.template('template1')],
  entities: [
    f.entity('entity1', 'template1', {}, { language: 'en' }),
    f.entity('entity1', 'template1', {}, { language: 'es' }),
  ],
};

const buildJob = (
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
          entitiesDS: EntitiesDataSourceFactory.forTesting(transactionManager),
          settingsDS: SettingsDataSourceFactory.default(transactionManager),
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
  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when processing a document in the default language', () => {
    beforeAll(async () => {
      await testingEnvironment.setUp({
        ...baseFixtures,
        files: [
          f.file('doc1', {
            type: 'document',
            status: 'processing',
            entity: 'entity1',
            language: 'en',
            mimetype: 'application/pdf',
          }),
        ],
      });
    });

    it('should set preview on all entity translations', async () => {
      const transactionManager = TransactionManagerFactory.fake();

      const thumbnail = FileBuilder.thumbnail('aaaaaaaaaaaaaaaaaaaaaaaa', {
        entity: 'entity1',
        language: 'en',
        filename: `${f.idString('doc1')}.jpg`,
      });

      await buildJob(transactionManager, { pdfLanguage: 'en', thumbnail }).execute(
        { documentId: f.idString('doc1') },
        true
      );

      const entities = await testingEnvironment.db.getAllFrom('entities');
      const en = entities.find(e => e.sharedId === 'entity1' && e.language === 'en');
      const es = entities.find(e => e.sharedId === 'entity1' && e.language === 'es');

      expect(en?.preview).toBe(`${f.idString('doc1')}.jpg`);
      expect(es?.preview).toBe(`${f.idString('doc1')}.jpg`);
    });
  });

  describe('when processing a document in a non-default language', () => {
    beforeAll(async () => {
      await testingEnvironment.setUp({
        ...baseFixtures,
        files: [
          f.file('doc2', {
            type: 'document',
            status: 'processing',
            entity: 'entity1',
            language: 'es',
            mimetype: 'application/pdf',
          }),
        ],
      });
    });

    it('should set preview using the language-matched thumbnail, falling back to it for other languages', async () => {
      const transactionManager = TransactionManagerFactory.fake();

      const thumbnail = FileBuilder.thumbnail('bbbbbbbbbbbbbbbbbbbbbbbb', {
        entity: 'entity1',
        language: 'es',
        filename: `${f.idString('doc2')}.jpg`,
      });

      await buildJob(transactionManager, { pdfLanguage: 'es', thumbnail }).execute(
        { documentId: f.idString('doc2') },
        true
      );

      const entities = await testingEnvironment.db.getAllFrom('entities');
      const en = entities.find(e => e.sharedId === 'entity1' && e.language === 'en');
      const es = entities.find(e => e.sharedId === 'entity1' && e.language === 'es');

      expect(es?.preview).toBe(`${f.idString('doc2')}.jpg`);
      expect(en?.preview).toBe(`${f.idString('doc2')}.jpg`);
    });
  });

  describe('when each language has its own document with a thumbnail', () => {
    beforeAll(async () => {
      await testingEnvironment.setUp({
        ...baseFixtures,
        files: [
          f.file('doc1', {
            type: 'document',
            status: 'ready',
            entity: 'entity1',
            language: 'en',
            mimetype: 'application/pdf',
          }),
          f.file('doc1-thumb', {
            type: 'thumbnail',
            entity: 'entity1',
            language: 'en',
            filename: `${f.idString('doc1')}.jpg`,
            mimetype: 'image/jpeg',
          }),
          f.file('doc2', {
            type: 'document',
            status: 'processing',
            entity: 'entity1',
            language: 'es',
            mimetype: 'application/pdf',
          }),
        ],
      });
    });

    it('should set a different preview per language', async () => {
      const transactionManager = TransactionManagerFactory.fake();

      const esThumbnail = FileBuilder.thumbnail('cccccccccccccccccccccccc', {
        entity: 'entity1',
        language: 'es',
        filename: `${f.idString('doc2')}.jpg`,
      });

      await buildJob(transactionManager, { pdfLanguage: 'es', thumbnail: esThumbnail }).execute(
        { documentId: f.idString('doc2') },
        true
      );

      const entities = await testingEnvironment.db.getAllFrom('entities');
      const en = entities.find(e => e.sharedId === 'entity1' && e.language === 'en');
      const es = entities.find(e => e.sharedId === 'entity1' && e.language === 'es');

      expect(en?.preview).toBe(`${f.idString('doc1')}.jpg`);
      expect(es?.preview).toBe(`${f.idString('doc2')}.jpg`);
    });
  });
});
