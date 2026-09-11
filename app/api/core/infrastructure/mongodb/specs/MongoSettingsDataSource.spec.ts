import { ObjectId } from 'mongodb';
import { Settings } from '#api/core/domain/settings/Settings.js';
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

const persist = async (mutate: (settings: Settings) => void) => {
  const sut = createSut();
  const settings = await sut.get();
  mutate(settings);
  await sut.update(settings);
  return sut;
};

describe('MongoSettingsDataSource', () => {
  describe('update()', () => {
    it('should persist a language added on the model', async () => {
      await persist(settings => {
        settings.addLanguage({ key: 'fr', label: 'French' });
      });

      const stored = await testingEnvironment.db.getCollection('settings')!.findOne({});
      expect(stored?.languages?.map((language: { key: string }) => language.key)).toContain('fr');
    });

    it('should persist tenant language fields and not catalog copies', async () => {
      await persist(settings => {
        settings.addLanguage({
          key: 'fr',
          label: 'French',
          ISO639_3: 'fra',
          ISO639_1: 'fr',
          localized_label: 'Français',
          elastic: 'french',
          translationAvailable: true,
        });
      });

      const stored = await testingEnvironment.db.getCollection('settings')!.findOne({});
      expect(stored?.languages?.find((language: { key: string }) => language.key === 'fr')).toEqual(
        { key: 'fr', label: 'French' }
      );
    });

    it('should persist installing on the targeted language', async () => {
      await persist(settings => {
        settings.setLanguageInstalling('es', true);
      });

      const stored = await testingEnvironment.db.getCollection('settings')!.findOne({});
      const spanish = stored?.languages?.find((language: { key: string }) => language.key === 'es');
      expect(spanish?.installing).toBe(true);
    });

    it('should persist a deleted language', async () => {
      await persist(settings => {
        settings.deleteLanguage('es');
      });

      const stored = await testingEnvironment.db.getCollection('settings')!.findOne({});
      expect(stored?.languages?.map((language: { key: string }) => language.key)).toEqual(['en']);
    });

    it('should merge applied fields onto the existing singleton', async () => {
      const sut = await persist(settings => {
        settings.apply({ site_name: 'Patched collection' }, () => 'unused');
      });

      const stored = await sut.find();
      expect(stored?.site_name).toBe('Patched collection');
      expect(stored?.languages?.map(language => language.key)).toEqual(['en', 'es']);
    });

    it('should persist nested collections without catalog copies or leftover _id', async () => {
      await persist(settings => {
        settings.apply(
          {
            languages: [{ key: 'en', label: 'English', default: true, ISO639_3: 'eng' }],
            links: [{ title: 'Home', type: 'link', url: '/' }],
            filters: [{ _id: 'noise', id: 't1', name: 'Cases' }],
          },
          () => 'aaaaaaaaaaaaaaaaaaaaaaaa'
        );
      });

      const stored = await testingEnvironment.db.getCollection('settings')!.findOne({});
      expect(stored?.languages).toEqual([{ key: 'en', label: 'English', default: true }]);
      expect(stored?.links).toEqual([
        { id: 'aaaaaaaaaaaaaaaaaaaaaaaa', title: 'Home', type: 'link', url: '/' },
      ]);
      expect(stored?.links?.[0]).not.toHaveProperty('_id');
      expect(stored?.filters).toEqual([{ id: 't1', name: 'Cases' }]);
    });

    it('should mint an ObjectId _id when creating a singleton without one', async () => {
      await testingEnvironment.db.getCollection('settings')!.deleteMany({});
      const sut = createSut();
      await sut.update(new Settings({ site_name: 'Minted' }));

      const stored = await sut.get();
      expect(stored._id).toBeInstanceOf(ObjectId);
      expect(stored.site_name).toBe('Minted');
    });
  });

  describe('reads', () => {
    it('should return null when no settings document exists', async () => {
      await testingEnvironment.db.getCollection('settings')!.deleteMany({});
      const sut = createSut();
      expect(await sut.find()).toBeNull();
    });

    it('readLanguages() should not load customCSS', async () => {
      const sut = createSut();
      await persist(settings => {
        settings.apply({ customCSS: 'HUGE' }, () => 'unused');
      });
      const languages = await sut.readLanguages();
      expect(languages?.map(language => language.key)).toEqual(['en', 'es']);
    });

    it('readPresentation() should omit sync', async () => {
      await testingEnvironment.db.getCollection('settings')!.updateOne(
        {},
        {
          $set: {
            site_name: 'Public',
            sync: [{ name: 'peer', url: 'http://a', username: 'u', password: 'p', config: {} }],
          },
        }
      );
      const sut = createSut();
      const presented = await sut.readPresentation();
      expect(presented?.site_name).toBe('Public');
      expect(presented?.sync).toBeUndefined();
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
  });

  describe('deactivateSyncConfig on the model', () => {
    it('should disable the named sync config when persisted', async () => {
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

      const sut = await persist(settings => {
        settings.deactivateSyncConfig('disable-me');
      });

      const stored = await sut.find();
      expect(stored?.sync).toEqual([
        expect.objectContaining({ name: 'keep-active', active: true }),
        expect.objectContaining({ name: 'disable-me', active: false }),
      ]);
    });
  });
});
