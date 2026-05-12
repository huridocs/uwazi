import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { tenants } from '#api/tenants/index.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { CloneLanguageEntitiesJobFactory } from '#api/core/infrastructure/factories/CloneLanguageEntitiesJobFactory.js';
import { EntityPreviewBatchHandler } from '../EntityPreviewBatchHandler.js';
import { search } from '#api/search/index.js';
import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';

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
    ...f.entityInMultipleLanguages(['en'], 'entity1', 'template1'),
    ...f.entityInMultipleLanguages(['en'], 'entity2', 'template1'),
  ],
  files: [
    // a ready PDF document for Spanish — language uses ISO 639-1 ('es'); the fixture factory
    // converts it to ISO 639-3 ('spa'), matching what CloneLanguageEntitiesJob queries
    f.file('doc1-es', {
      type: 'document',
      status: 'ready',
      entity: 'entity1',
      language: 'es',
      mimetype: 'application/pdf',
    }),
  ],
};

const heartbeat = jest.fn();

const mockEntityIndexer = { sync: jest.fn().mockResolvedValue(undefined) };

const createSUT = (
  mockWebSockets: jest.Mocked<WebSockets>,
  innerDispatcher: SyncDispatcherForTests = new SyncDispatcherForTests({}),
  mockSettingsDS?: jest.Mocked<Pick<SettingsDataSource, 'setLanguageInstalling'>>
) =>
  testingEnvironment.runWithContext(() =>
    CloneLanguageEntitiesJobFactory.default({
      jobsDispatcher: innerDispatcher,
      webSockets: mockWebSockets,
      entityIndexer: mockEntityIndexer as any,
      ...(mockSettingsDS ? { settingsDS: mockSettingsDS as any } : {}),
    })
  );

const dispatch = async (job: ReturnType<typeof createSUT>, pairs: { from: string; to: string }[]) =>
  job.handleDispatch(heartbeat, { pairs } as any, {
    namespace: tenants.current().name,
    maxRetries: 3,
    retryCount: 0,
  });

describe('CloneLanguageEntitiesJob', () => {
  let mockWebSockets: jest.Mocked<WebSockets>;

  beforeEach(async () => {
    mockWebSockets = { emitToTenant: jest.fn(), emitToTenantAdmins: jest.fn() };
    heartbeat.mockClear();
    mockEntityIndexer.sync.mockClear();
    jest.spyOn(search, 'indexEntities').mockResolvedValue(undefined as any);
    await testingEnvironment.setUp(fixtures);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when cloning entities for a language pair', () => {
    it('should create entity documents for the target language', async () => {
      await dispatch(createSUT(mockWebSockets), [{ from: 'en', to: 'ja' }]);

      const cloned = await testingEnvironment.db
        .getCollection('entities')!
        .find({ language: 'ja' })
        .toArray();

      expect(cloned).toHaveLength(2);
    });

    it('should index entities in elasticsearch for the target language', async () => {
      await dispatch(createSUT(mockWebSockets), [{ from: 'en', to: 'ja' }]);

      expect(search.indexEntities).toHaveBeenCalledWith({ language: 'ja' });
    });

    it('should call the V2 entity indexer with the cloned sharedIds', async () => {
      await dispatch(createSUT(mockWebSockets), [{ from: 'en', to: 'ja' }]);

      expect(mockEntityIndexer.sync).toHaveBeenCalled();
      const allSharedIds = mockEntityIndexer.sync.mock.calls.flatMap((args: any[]) => args[0]);
      expect(allSharedIds).toEqual(expect.arrayContaining(['entity1', 'entity2']));
    });

    it('should call heartbeat once after cloning', async () => {
      await dispatch(createSUT(mockWebSockets), [{ from: 'en', to: 'ja' }]);

      expect(heartbeat).toHaveBeenCalledTimes(1);
    });
  });

  describe('when cloning multiple language pairs', () => {
    it('should clone and index entities for each pair', async () => {
      await dispatch(createSUT(mockWebSockets), [
        { from: 'en', to: 'ja' },
        { from: 'en', to: 'zh' },
      ]);

      const jaEntities = await testingEnvironment.db
        .getCollection('entities')!
        .find({ language: 'ja' })
        .toArray();
      const zhEntities = await testingEnvironment.db
        .getCollection('entities')!
        .find({ language: 'zh' })
        .toArray();

      expect(jaEntities).toHaveLength(2);
      expect(zhEntities).toHaveLength(2);
      expect(search.indexEntities).toHaveBeenCalledWith({ language: 'ja' });
      expect(search.indexEntities).toHaveBeenCalledWith({ language: 'zh' });
      const allSyncedIds = mockEntityIndexer.sync.mock.calls.flatMap((args: any[]) => args[0]);
      expect(allSyncedIds).toEqual(expect.arrayContaining(['entity1', 'entity2']));
      expect(mockEntityIndexer.sync).toHaveBeenCalledTimes(2);
    });

    it('should call heartbeat once per language pair', async () => {
      await dispatch(createSUT(mockWebSockets), [
        { from: 'en', to: 'ja' },
        { from: 'en', to: 'zh' },
      ]);

      expect(heartbeat).toHaveBeenCalledTimes(2);
    });
  });

  describe('when ready PDF files exist for the target language', () => {
    it('should dispatch EntityPreviewBatchHandler with the matching entity sharedIds', async () => {
      const previewHandlerSpy = jest.fn().mockResolvedValue(undefined);
      const innerDispatcher = new SyncDispatcherForTests({
        [EntityPreviewBatchHandler.name]: async () =>
          ({ handleDispatch: previewHandlerSpy }) as any,
      });

      await dispatch(createSUT(mockWebSockets, innerDispatcher), [{ from: 'en', to: 'es' }]);

      expect(previewHandlerSpy).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          languageKey: 'es',
          sharedIds: expect.arrayContaining(['entity1']),
        }),
        expect.anything()
      );
    });
  });

  describe('when no ready PDF files exist for the target language', () => {
    it('should not dispatch EntityPreviewBatchHandler', async () => {
      const previewHandlerSpy = jest.fn().mockResolvedValue(undefined);
      const innerDispatcher = new SyncDispatcherForTests({
        [EntityPreviewBatchHandler.name]: async () =>
          ({ handleDispatch: previewHandlerSpy }) as any,
      });

      // 'ja' has no files in fixtures
      await dispatch(createSUT(mockWebSockets, innerDispatcher), [{ from: 'en', to: 'ja' }]);

      expect(previewHandlerSpy).not.toHaveBeenCalled();
    });
  });

  describe('when jobInfo is provided', () => {
    it('should emit translationsInstallDone to the tenant', async () => {
      await dispatch(createSUT(mockWebSockets), [{ from: 'en', to: 'ja' }]);

      expect(mockWebSockets.emitToTenant).toHaveBeenCalledWith(
        tenants.current().name,
        'translationsInstallDone'
      );
    });

    it('should emit translationsInstallDone only once regardless of how many pairs are processed', async () => {
      await dispatch(createSUT(mockWebSockets), [
        { from: 'en', to: 'ja' },
        { from: 'en', to: 'zh' },
      ]);

      expect(mockWebSockets.emitToTenant).toHaveBeenCalledTimes(1);
    });
  });

  describe('when jobInfo is not provided', () => {
    it('should not emit translationsInstallDone', async () => {
      const job = createSUT(mockWebSockets);
      await job.handleDispatch(heartbeat, { pairs: [{ from: 'en', to: 'ja' }] } as any, undefined);

      expect(mockWebSockets.emitToTenant).not.toHaveBeenCalled();
    });
  });

  describe('installing flag management', () => {
    it('should clear installing flag for each target language on success', async () => {
      const mockSettingsDS = { setLanguageInstalling: jest.fn().mockResolvedValue(undefined) };

      await dispatch(createSUT(mockWebSockets, new SyncDispatcherForTests({}), mockSettingsDS), [
        { from: 'en', to: 'ja' },
        { from: 'en', to: 'zh' },
      ]);

      expect(mockSettingsDS.setLanguageInstalling).toHaveBeenCalledWith('ja', false);
      expect(mockSettingsDS.setLanguageInstalling).toHaveBeenCalledWith('zh', false);
    });

    it('should clear installing flag on final retry failure', async () => {
      const mockSettingsDS = { setLanguageInstalling: jest.fn().mockResolvedValue(undefined) };
      jest.spyOn(search, 'indexEntities').mockRejectedValue(new Error('index failed'));

      const job = createSUT(mockWebSockets, new SyncDispatcherForTests({}), mockSettingsDS);
      await expect(
        job.handleDispatch(heartbeat, { pairs: [{ from: 'en', to: 'ja' }] } as any, {
          namespace: tenants.current().name,
          retryCount: 3,
          maxRetries: 3,
        })
      ).rejects.toThrow('index failed');

      expect(mockSettingsDS.setLanguageInstalling).toHaveBeenCalledWith('ja', false);
    });

    it('should NOT clear installing flag on non-final retry failure', async () => {
      const mockSettingsDS = { setLanguageInstalling: jest.fn().mockResolvedValue(undefined) };
      jest.spyOn(search, 'indexEntities').mockRejectedValue(new Error('index failed'));

      const job = createSUT(mockWebSockets, new SyncDispatcherForTests({}), mockSettingsDS);
      await expect(
        job.handleDispatch(heartbeat, { pairs: [{ from: 'en', to: 'ja' }] } as any, {
          namespace: tenants.current().name,
          retryCount: 1,
          maxRetries: 3,
        })
      ).rejects.toThrow('index failed');

      expect(mockSettingsDS.setLanguageInstalling).not.toHaveBeenCalled();
    });
  });
});
