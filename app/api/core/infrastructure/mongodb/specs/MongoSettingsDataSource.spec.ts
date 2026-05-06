import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { MongoSettingsDataSource } from '../MongoSettingsDataSource.js';

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, label: 'English', key: 'en' },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

const createSut = () =>
  new MongoSettingsDataSource(getConnection(), TransactionManagerFactory.default());

describe('MongoSettingsDataSource', () => {
  describe('setLanguageInstalling()', () => {
    it('should set installing to true for the given language key', async () => {
      const sut = createSut();
      await sut.setLanguageInstalling('es', true);

      const settings = await testingEnvironment.db.getCollection('settings')!.findOne({});
      const esLanguage = settings?.languages?.find((l: any) => l.key === 'es');
      expect(esLanguage?.installing).toBe(true);
    });

    it('should set installing to false for the given language key', async () => {
      const sut = createSut();
      await sut.setLanguageInstalling('es', true);
      await sut.setLanguageInstalling('es', false);

      const settings = await testingEnvironment.db.getCollection('settings')!.findOne({});
      const esLanguage = settings?.languages?.find((l: any) => l.key === 'es');
      expect(esLanguage?.installing).toBe(false);
    });

    it('should only affect the targeted language', async () => {
      const sut = createSut();
      await sut.setLanguageInstalling('es', true);

      const settings = await testingEnvironment.db.getCollection('settings')!.findOne({});
      const enLanguage = settings?.languages?.find((l: any) => l.key === 'en');
      expect(enLanguage?.installing).toBeUndefined();
    });
  });
});
