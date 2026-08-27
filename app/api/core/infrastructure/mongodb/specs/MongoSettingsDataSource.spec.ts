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

  describe('deleteLanguage()', () => {
    it('should remove the language from the list', async () => {
      const sut = createSut();
      await sut.deleteLanguage('en');

      const settings = await testingEnvironment.db.getCollection('settings')!.findOne({});
      expect(settings?.languages?.map((l: any) => l.key)).toEqual(['es']);
    });
  });

  describe('find() and patch()', () => {
    it('should return null when no settings document exists', async () => {
      await testingEnvironment.db.getCollection('settings')!.deleteMany({});
      const sut = createSut();
      expect(await sut.find()).toBeNull();
    });

    it('readFields() should return only the requested keys', async () => {
      const sut = createSut();
      const slice = await sut.readFields(['languages']);
      expect(slice?.languages?.map(l => l.key)).toEqual(['en', 'es']);
      expect((slice as { site_name?: string } | null)?.site_name).toBeUndefined();
    });

    it('readSyncConfig() should return only the sync slice', async () => {
      await testingEnvironment.db.getCollection('settings')!.updateOne(
        {},
        {
          $set: {
            site_name: 'Should not be needed',
            sync: [{ name: 'peer', url: 'http://a', username: 'u', password: 'p', config: {} }],
          },
        }
      );
      const sut = createSut();
      expect(await sut.readSyncConfig()).toEqual([
        expect.objectContaining({ name: 'peer', url: 'http://a' }),
      ]);
    });

    it('should merge incoming fields onto the existing singleton', async () => {
      const sut = createSut();
      await sut.patch({ site_name: 'Patched collection' });

      const stored = await sut.find();
      expect(stored?.site_name).toBe('Patched collection');
      expect(stored?.languages?.map(l => l.key)).toEqual(['en', 'es']);
    });
  });

  describe('deactivateSyncConfig()', () => {
    it('should disable the named sync config', async () => {
      await testingEnvironment.db.getCollection('settings')!.updateOne(
        {},
        {
          $set: {
            sync: [
              { name: 'keep-active', url: 'http://a', active: true, config: {} },
              { name: 'disable-me', url: 'http://b', active: true, config: {} },
            ],
          },
        }
      );

      const sut = createSut();
      expect(await sut.deactivateSyncConfig('disable-me')).toBe(1);

      const stored = await sut.find();
      expect(stored?.sync).toEqual([
        expect.objectContaining({ name: 'keep-active', active: true }),
        expect.objectContaining({ name: 'disable-me', active: false }),
      ]);
    });
  });
});
