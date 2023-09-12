import { WithId } from 'api/odm';
import db from 'api/utils/testing_db';
import translations from 'api/i18n/translations';
import { Settings } from 'shared/types/settingsType';
import settings from '../settings';
import fixtures, { linkFixtures, newLinks } from './fixtures';

describe('settings', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.spyOn(translations, 'updateContext').mockImplementation(async () => Promise.resolve('ok'));
    await db.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('save()', () => {
    it('should save the settings', async () => {
      const config = { site_name: 'My collection' };
      await settings.save(config);
      await settings.save({ custom: { customNested: 'data' } });
      const result = await settings.get();
      expect(result.site_name).toBe('My collection');
      expect(typeof result.custom === 'object' && result.custom.customNested).toBe('data');
    });

    it('should return the updated settings', async () => {
      const config = { site_name: 'New settings' };

      const createdDocument = await settings.save(config);
      expect(createdDocument.site_name).toBe(config.site_name);
      expect(createdDocument.allowedPublicTemplates?.[0]).toBe('id1');
      expect(createdDocument.allowedPublicTemplates?.[1]).toBe('id2');
    });

    describe('when there are Links', () => {
      const baseLink = { title: 'Page one', type: 'link' as 'link', url: 'url' };
      const baseConfig = {
        site_name: 'My collection',
        links: [{ ...baseLink }],
      };

      it('should create a translation context for the passed links', async () => {
        await settings.save(baseConfig);
        expect(translations.updateContext).toHaveBeenCalledWith(
          { id: 'Menu', label: 'Menu', type: 'Uwazi UI' },
          {},
          [],
          { 'Page one': 'Page one' }
        );
      });

      it('should create a translation context for passed links with sublinks', async () => {
        const config = {
          ...baseConfig,
          links: [
            {
              title: 'Page one',
              type: 'group' as 'group',
              sublinks: [{ title: 'Page two', url: 'url2' }],
            },
          ],
        };
        await settings.save(config);
        expect(translations.updateContext).toHaveBeenCalledWith(
          { id: 'Menu', label: 'Menu', type: 'Uwazi UI' },
          {},
          [],
          { 'Page one': 'Page one', 'Page two': 'Page two' }
        );
      });

      describe('updating the links', () => {
        it('should update the translation context for the links', async () => {
          const config1 = {
            ...baseConfig,
            links: [
              ...baseConfig.links,
              { title: 'Page two', type: 'link' as 'link', url: 'url2' },
            ],
          };
          const savedConfig = await settings.save(config1);
          const config2 = {
            ...baseConfig,
            links: [
              {
                title: 'Page 1',
                _id: savedConfig.links?.[0]._id,
                type: 'link' as 'link',
                url: 'url',
              },
              { title: 'Page three', type: 'link' as 'link', url: 'url3' },
            ],
          };
          await settings.save(config2);
          expect(translations.updateContext).toHaveBeenCalledWith(
            { id: 'Menu', label: 'Menu', type: 'Uwazi UI' },
            { 'Page one': 'Page 1' },
            ['Page two'],
            { 'Page 1': 'Page 1', 'Page three': 'Page three' }
          );
        });

        it('should update the translation context for the links with sublinks', async () => {
          const config = {
            ...baseConfig,
            links: [
              ...baseConfig.links,
              {
                title: 'Page two',
                type: 'group' as 'group',
                sublinks: [{ title: 'Subpage two', url: 'urlsub2' }],
              },
            ],
          };
          const savedConfig = await settings.save(config);
          const finalConfig = {
            ...baseConfig,
            links: [
              {
                title: 'Page 1',
                _id: savedConfig.links?.[0]._id,
                type: 'link' as 'link',
                url: 'url',
              },
              { title: 'Page three', type: 'link' as 'link', url: 'url3' },
            ],
          };
          await settings.save(finalConfig);

          expect(translations.updateContext).toHaveBeenCalledWith(
            { id: 'Menu', label: 'Menu', type: 'Uwazi UI' },
            { 'Page one': 'Page 1' },
            ['Subpage two', 'Page two'],
            { 'Page 1': 'Page 1', 'Page three': 'Page three' }
          );
        });
      });
    });

    describe('when there are filter groups', () => {
      it('should create translations for them', async () => {
        const config: Settings = {
          site_name: 'My collection',
          filters: [
            { id: '1', name: 'Judge' },
            { id: '2', name: 'Documents', items: [{ id: '3', name: 'Cause' }] },
          ],
        };
        await settings.save(config);
        expect(translations.updateContext).toHaveBeenCalledWith(
          { id: 'Filters', label: 'Filters', type: 'Uwazi UI' },
          {},
          [],
          { Documents: 'Documents' }
        );
      });

      it('should update them', async () => {
        let config = {
          site_name: 'My collection',
          filters: [
            { id: '1', name: 'Judge' },
            { id: '2', name: 'Documents', items: [] },
            { id: '3', name: 'Files', items: [] },
          ],
        };
        await settings.save(config);
        config = {
          site_name: 'My collection',
          filters: [
            { id: '1', name: 'Judge' },
            { id: '2', name: 'Important Documents', items: [] },
          ],
        };
        await settings.save(config);
        expect(translations.updateContext).toHaveBeenCalledWith(
          { id: 'Filters', label: 'Filters', type: 'Uwazi UI' },
          { Documents: 'Important Documents' },
          ['Files'],
          { 'Important Documents': 'Important Documents' }
        );
      });
    });

    describe('when no links or filters are present', () => {
      it('should not update contexts translations', async () => {
        await settings.save({ custom: 'something that does not have links' });
        await translations.get();
        expect(translations.updateContext).not.toHaveBeenCalled();
      });
    });
  });

  describe('get()', () => {
    describe('if there is no settings on the DB', () => {
      it('should return an empty object', async () => {
        await db.clear(['settings']);

        const result = await settings.get();
        expect(result).toEqual({});
      });
    });

    it('should not return private values', async () => {
      const values = await settings.get();
      expect(values.publicFormDestination).not.toBeDefined();
    });

    describe('if there is settings with no map starting point on the DB', () => {
      it('should return the default starting point', async () => {
        const settingsFromModel = await settings.get();
        const SWITZERLAND_COORDINATES = [{ lat: 46, lon: 6 }];
        expect(settingsFromModel.mapStartingPoint).toEqual(SWITZERLAND_COORDINATES);
      });
    });

    describe('if map starting point is set to empty array on the DB', () => {
      it('should return the default starting point', async () => {
        await settings.save({ mapStartingPoint: [] });
        const settingsFromModel = await settings.get();
        const SWITZERLAND_COORDINATES = [{ lat: 46, lon: 6 }];
        expect(settingsFromModel.mapStartingPoint).toEqual(SWITZERLAND_COORDINATES);
      });
    });
  });

  describe('setDefaultLanguage()', () => {
    it('should save the settings with the new default language', async () => {
      await settings.setDefaultLanguage('en');
      const result = await settings.get();
      expect(result.languages?.[1].key).toBe('en');
      expect(result.languages?.[1].default).toBe(true);
    });
  });

  describe('addLanguage()', () => {
    it('should add a to settings list language', async () => {
      await settings.addLanguage({ key: 'fr', label: 'Frances' });
      const result = await settings.get();
      expect(result.languages?.length).toBe(3);
    });
  });

  describe('deleteLanguage()', () => {
    it('should add a to settings list language', async () => {
      await settings.deleteLanguage('en');
      const result = await settings.get();
      expect(result.languages?.length).toBe(1);
    });
  });

  describe('removeTemplateFromFilters', () => {
    it('should remove the template from the filters', async () => {
      const _settings = {
        filters: [
          { id: '123' },
          {
            id: 'axz',
            items: [{ id: '123' }],
          },
        ],
      };
      jest.spyOn(settings, 'get').mockImplementation(async () => Promise.resolve(_settings));
      jest
        .spyOn(settings, 'save')
        .mockImplementation(async () => Promise.resolve({} as WithId<Settings>));
      await settings.removeTemplateFromFilters('123');
      expect(settings.save).toHaveBeenCalledWith({ filters: [{ id: 'axz', items: [] }] });
    });
  });

  describe('updateFilterName', () => {
    const _settings = {
      filters: [{ id: '123', name: 'Batman' }],
    };

    it('should update a filter name', async () => {
      jest.spyOn(settings, 'get').mockImplementation(async () => Promise.resolve(_settings));
      jest
        .spyOn(settings, 'save')
        .mockImplementation(async () =>
          Promise.resolve({ project: 'updatedSettings' } as WithId<Settings>)
        );

      const updatedFilter = await settings.updateFilterName('123', 'The dark knight');

      expect(settings.save).toHaveBeenCalledWith({
        filters: [{ id: '123', name: 'The dark knight' }],
      });
      expect(updatedFilter?.project).toEqual('updatedSettings');
    });

    it('should do nothing when filter does not exist', async () => {
      jest.spyOn(settings, 'get').mockImplementation(async () => Promise.resolve(_settings));
      jest
        .spyOn(settings, 'save')
        .mockImplementation(async () => Promise.resolve({} as WithId<Settings>));

      const updatedFilter = await settings.updateFilterName('321', 'Filter not present');

      expect(settings.save).not.toHaveBeenCalled();
      expect(updatedFilter).toBeUndefined();
    });
  });

  describe('getLinks', () => {
    it('should return the links', async () => {
      await db.setupFixturesAndContext(linkFixtures);
      const result = await settings.getLinks();
      expect(result).toEqual(linkFixtures.settings?.[0].links);
    });
  });

  describe('saveLinks', () => {
    it('should save the links', async () => {
      await db.setupFixturesAndContext(linkFixtures);
      await settings.saveLinks(newLinks);
      const result = await settings.getLinks();
      expect(result).toEqual(newLinks);
    });
  });
});
