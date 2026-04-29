import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { tenants } from '#api/tenants/index.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { EntityPreviewBatchHandler } from '../EntityPreviewBatchHandler.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

const f = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  templates: [f.template('template1')],
  entities: [
    ...f.entityInMultipleLanguages(['en', 'es'], 'entity1', 'template1'),
    ...f.entityInMultipleLanguages(['en', 'es'], 'entity2', 'template1'),
    ...f.entityInMultipleLanguages(['en', 'es'], 'entity3', 'template1'),
  ],
  files: [
    // entity1: has thumbnails for both en and es
    f.file('doc1-en', {
      type: 'document',
      status: 'ready',
      entity: 'entity1',
      language: 'en',
      mimetype: 'application/pdf',
    }),
    f.file('doc1-en-thumb', {
      type: 'thumbnail',
      entity: 'entity1',
      language: 'en',
      filename: `${f.idString('doc1-en')}.jpg`,
      mimetype: 'image/jpeg',
    }),
    f.file('doc1-es', {
      type: 'document',
      status: 'ready',
      entity: 'entity1',
      language: 'es',
      mimetype: 'application/pdf',
    }),
    f.file('doc1-es-thumb', {
      type: 'thumbnail',
      entity: 'entity1',
      language: 'es',
      filename: `${f.idString('doc1-es')}.jpg`,
      mimetype: 'image/jpeg',
    }),
    // entity2: has only an en thumbnail
    f.file('doc2-en', {
      type: 'document',
      status: 'ready',
      entity: 'entity2',
      language: 'en',
      mimetype: 'application/pdf',
    }),
    f.file('doc2-en-thumb', {
      type: 'thumbnail',
      entity: 'entity2',
      language: 'en',
      filename: `${f.idString('doc2-en')}.jpg`,
      mimetype: 'image/jpeg',
    }),
    // entity3: has no thumbnails at all
  ],
};

const createSUT = () =>
  testingEnvironment.runWithContext(
    () =>
      new EntityPreviewBatchHandler({
        transactionManager: ExecutionContext.transactionManager,
        filesDS: FilesDataSourceFactory.default(),
        entitiesDS: EntitiesDataSourceFactory.forTesting(ExecutionContext.transactionManager),
        settingsDS: SettingsDataSourceFactory.default(ExecutionContext.transactionManager),
      })
  );

const heartbeat = jest.fn();

const dispatch = async (
  handler: EntityPreviewBatchHandler,
  sharedIds: string[],
  languageKey: 'en' | 'es' = 'es'
) =>
  handler.handleDispatch(
    heartbeat,
    { languageKey, sharedIds },
    { namespace: tenants.current().name, maxRetries: 3, retryCount: 0 }
  );

const getEntityPreviews = async (sharedId: string) => {
  const all = await testingEnvironment.db.getAllFrom('entities');
  return {
    en: all.find(e => e.sharedId === sharedId && e.language === 'en')?.preview,
    es: all.find(e => e.sharedId === sharedId && e.language === 'es')?.preview,
  };
};

describe('EntityPreviewBatchHandler', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when an entity has a thumbnail in the target language', () => {
    it('should set each translation preview to its own language thumbnail', async () => {
      await dispatch(createSUT(), ['entity1']);

      const entities = await testingEnvironment.db.getAllFrom('entities');
      const en = entities.find(e => e.sharedId === 'entity1' && e.language === 'en');
      const es = entities.find(e => e.sharedId === 'entity1' && e.language === 'es');

      expect(en?.preview).toBe(`${f.idString('doc1-en')}.jpg`);
      expect(es?.preview).toBe(`${f.idString('doc1-es')}.jpg`);
    });
  });

  describe('when an entity has only a default-language thumbnail', () => {
    it('should set all translations to the default-language thumbnail', async () => {
      await dispatch(createSUT(), ['entity2']);

      const entities = await testingEnvironment.db.getAllFrom('entities');
      const en = entities.find(e => e.sharedId === 'entity2' && e.language === 'en');
      const es = entities.find(e => e.sharedId === 'entity2' && e.language === 'es');

      expect(en?.preview).toBe(`${f.idString('doc2-en')}.jpg`);
      expect(es?.preview).toBe(`${f.idString('doc2-en')}.jpg`);
    });
  });

  describe('when an entity has no thumbnails', () => {
    it('should clear preview on all translations', async () => {
      await dispatch(createSUT(), ['entity3']);

      const entities = await testingEnvironment.db.getAllFrom('entities');
      const en = entities.find(e => e.sharedId === 'entity3' && e.language === 'en');
      const es = entities.find(e => e.sharedId === 'entity3' && e.language === 'es');

      expect(en?.preview).toBeUndefined();
      expect(es?.preview).toBeUndefined();
    });
  });

  describe('when processing multiple entities in a batch', () => {
    it('should correctly recalculate preview for each entity independently', async () => {
      await dispatch(createSUT(), ['entity1', 'entity2', 'entity3']);

      const [e1, e2, e3] = await Promise.all([
        getEntityPreviews('entity1'),
        getEntityPreviews('entity2'),
        getEntityPreviews('entity3'),
      ]);

      expect(e1).toEqual({
        en: `${f.idString('doc1-en')}.jpg`,
        es: `${f.idString('doc1-es')}.jpg`,
      });
      expect(e2).toEqual({
        en: `${f.idString('doc2-en')}.jpg`,
        es: `${f.idString('doc2-en')}.jpg`,
      });
      expect(e3).toEqual({ en: undefined, es: undefined });
    });
  });
});
