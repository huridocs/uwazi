import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { SettingsDataSourceFactory } from '../../factories/SettingsDataSourceFactory.js';

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
  testingEnvironment.runWithContext(() => SettingsDataSourceFactory.default());

describe('MongoSettingsDataSource', () => {
  describe('addLanguage()', () => {
    it('should add a new language', async () => {
      const sut = createSut();
      await sut.addLanguage({ key: 'fr', label: 'French' });

      const settings = await testingEnvironment.db.getCollection('settings')!.findOne({});
      expect(settings?.languages?.map((l: any) => l.key)).toContain('fr');
    });

    it('should be idempotent: concurrent calls for the same key produce exactly one entry', async () => {
      const sut = createSut();
      await Promise.all([
        sut.addLanguage({ key: 'fr', label: 'French' }),
        sut.addLanguage({ key: 'fr', label: 'French' }),
        sut.addLanguage({ key: 'fr', label: 'French' }),
      ]);

      const settings = await testingEnvironment.db.getCollection('settings')!.findOne({});
      const frEntries = settings?.languages?.filter((l: any) => l.key === 'fr');
      expect(frEntries).toHaveLength(1);
    });
  });

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
