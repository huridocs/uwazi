import db, { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import pages from '../index.js';
import { AddLanguagePagesListener } from '../AddLanguagePagesListener.js';

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  pages: [
    {
      _id: db.id(),
      sharedId: 'page1',
      language: 'en',
      title: 'Test page',
      user: 'user1',
    },
  ],
};

const heartbeat = jest.fn();

const createSUT = (settingsDS?: SettingsDataSource) =>
  testingEnvironment.runWithContext(() => {
    const ds = settingsDS ?? SettingsDataSourceFactory.default();
    return new AddLanguagePagesListener({ settingsDS: ds });
  });

const dispatch = async (listener: AddLanguagePagesListener, language: string): Promise<void> => {
  await listener.handleDispatch(heartbeat, {
    tenantName: 'localhost',
    userId: 'user1',
    language,
    defaultLanguage: 'en',
  } as any);
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('AddLanguagePagesListener', () => {
  describe('when the language still exists in settings', () => {
    it('should create pages for the new language', async () => {
      const listener = await createSUT();
      await dispatch(listener, 'es');

      const esPages = await pages.get({ language: 'es' });
      expect(esPages.length).toBeGreaterThan(0);
    });
  });

  describe('when the language no longer exists in settings', () => {
    it('should throw a NonRetryableJobError and not create pages', async () => {
      const listener = await createSUT();
      await expect(dispatch(listener, 'fr')).rejects.toThrow(NonRetryableJobError);

      const frPages = await pages.get({ language: 'fr' });
      expect(frPages).toHaveLength(0);
    });
  });
});
