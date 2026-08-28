import { TestUtils } from '#api/common.v2/utils/Test.js';
import { TranslationsService } from '#api/core/application/translation/TranslationsService.js';
import { TranslationsServiceFactory } from '#api/core/infrastructure/factories/TranslationsServiceFactory.js';
import { SaveSettingsUseCaseFactory } from '#api/core/infrastructure/factories/SaveSettingsUseCaseFactory.js';
import { SaveMenuItemsUseCaseFactory } from '#api/core/infrastructure/factories/SaveMenuItemsUseCaseFactory.js';
import { SetDefaultLanguageUseCaseFactory } from '#api/core/infrastructure/factories/SetDefaultLanguageUseCaseFactory.js';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';
import { RemoveTemplateFromFiltersUseCaseFactory } from '#api/core/infrastructure/factories/RemoveTemplateFromFiltersUseCaseFactory.js';
import { UpdateFilterNameUseCaseFactory } from '#api/core/infrastructure/factories/UpdateFilterNameUseCaseFactory.js';
import db from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { SaveSettingsInput } from '../../SaveSettings.js';
import fixtures, { linkFixtures, newLinks } from './fixtures.js';

const testConfigs = [
  { name: 'Mongo', postgresSettings: false },
  { name: 'Postgres', postgresSettings: true },
];

describe('settings', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresSettings }) => {
    const settingsContext = () =>
      postgresSettings
        ? {
            tenant: {
              ...testingTenants.current(),
              featureFlags: { postgresSettings: true },
            },
          }
        : undefined;

    const withSettings = <T>(fn: () => T) =>
      testingEnvironment.runWithContext(fn, settingsContext());

    const saveSettings = async (input: SaveSettingsInput) =>
      withSettings(async () => SaveSettingsUseCaseFactory.default().execute(input));
    const getSettings = async () =>
      withSettings(async () => SettingsQueryServiceFactory.default().getForAdmin());

    const setUpSettings = async (data = fixtures) => {
      await testingEnvironment.setUp(data, {
        postgres: true,
        postgresMirror: postgresSettings ? ['settings'] : [],
      });
    };

    let updateContextExecute: jest.Mock;

    beforeEach(async () => {
      jest.restoreAllMocks();
      updateContextExecute = jest.fn().mockResolvedValue(undefined);
      jest.spyOn(TranslationsServiceFactory, 'default').mockReturnValue(
        TestUtils.mockClass<TranslationsService>({
          updateContext: updateContextExecute,
        })
      );
      await setUpSettings();
    });

    describe('save()', () => {
      it('should save the settings', async () => {
        const config = { site_name: 'My collection' };
        await saveSettings(config);
        await saveSettings({ custom: { customNested: 'data' } });
        const result = await getSettings();
        expect(result.site_name).toBe('My collection');
        expect(typeof result.custom === 'object' && result.custom.customNested).toBe('data');
      });

      it('should return the updated settings', async () => {
        const config = { site_name: 'New settings' };

        const createdDocument = await saveSettings(config);
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
          await saveSettings(baseConfig);
          expect(updateContextExecute).toHaveBeenCalledWith({
            context: { id: 'Menu', label: 'Menu', type: 'Uwazi UI' },
            keyChanges: {},
            keysToDelete: [],
            valueChanges: { 'Page one': 'Page one' },
          });
        });

        it('should persist Menu translation rows with the settings document', async () => {
          (TranslationsServiceFactory.default as jest.Mock).mockRestore();

          await withSettings(async () => {
            await saveSettings(baseConfig);
          });

          const rows = await testingEnvironment.db.getAllFrom('translationsV2');
          const menuKeys = rows
            .filter(row => (row.context as { id?: string } | undefined)?.id === 'Menu')
            .map(row => `${row.language}:${row.key}:${row.value}`)
            .sort();

          expect(menuKeys).toEqual(['en:Page one:Page one', 'es:Page one:Page one']);
        });

        it('should create a translation context for passed links with sublinks', async () => {
          const config = {
            ...baseConfig,
            links: [
              {
                title: 'Page one',
                type: 'group' as 'group',
                sublinks: [{ title: 'Page two', url: 'url2', type: 'link' as 'link' }],
              },
            ],
          };
          await saveSettings(config);
          expect(updateContextExecute).toHaveBeenCalledWith({
            context: { id: 'Menu', label: 'Menu', type: 'Uwazi UI' },
            keyChanges: {},
            keysToDelete: [],
            valueChanges: { 'Page one': 'Page one', 'Page two': 'Page two' },
          });
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
            const savedConfig = await saveSettings(config1);
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
            await saveSettings(config2);
            expect(updateContextExecute).toHaveBeenCalledWith({
              context: { id: 'Menu', label: 'Menu', type: 'Uwazi UI' },
              keyChanges: { 'Page one': 'Page 1' },
              keysToDelete: ['Page two'],
              valueChanges: { 'Page 1': 'Page 1', 'Page three': 'Page three' },
            });
          });

          it('should update the translation context for the links with sublinks', async () => {
            const config = {
              ...baseConfig,
              links: [
                ...baseConfig.links,
                {
                  title: 'Page two',
                  type: 'group' as 'group',
                  sublinks: [{ title: 'Subpage two', url: 'urlsub2', type: 'link' as 'link' }],
                },
              ],
            };
            const savedConfig = await saveSettings(config);
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
            await saveSettings(finalConfig);

            expect(updateContextExecute).toHaveBeenCalledWith({
              context: { id: 'Menu', label: 'Menu', type: 'Uwazi UI' },
              keyChanges: { 'Page one': 'Page 1' },
              keysToDelete: ['Subpage two', 'Page two'],
              valueChanges: { 'Page 1': 'Page 1', 'Page three': 'Page three' },
            });
          });

          it('should update the translation for links moving to groups', async () => {
            const config = {
              ...baseConfig,
              links: [
                ...baseConfig.links,
                { title: 'Page two', type: 'link' as 'link', url: 'url2' },
                {
                  title: 'Group one',
                  type: 'group' as 'group',
                  sublinks: [],
                },
              ],
            };
            const savedConfig = await saveSettings(config);
            const finalConfig = {
              ...baseConfig,
              links: [
                {
                  title: 'Page one',
                  type: 'link' as 'link',
                  url: 'url',
                  _id: savedConfig.links?.[0]._id,
                },
                {
                  title: 'Group one',
                  type: 'group' as 'group',
                  sublinks: [
                    {
                      title: 'Page 2',
                      type: 'link' as 'link',
                      url: 'url2',
                      _id: savedConfig.links?.[1]._id,
                    },
                  ],
                  _id: savedConfig.links?.[2]._id,
                },
              ],
            };

            jest.clearAllMocks();
            await saveSettings(finalConfig);

            expect(updateContextExecute).toHaveBeenCalledWith({
              context: { id: 'Menu', label: 'Menu', type: 'Uwazi UI' },
              keyChanges: { 'Page two': 'Page 2' },
              keysToDelete: [],
              valueChanges: {
                'Page one': 'Page one',
                'Group one': 'Group one',
                'Page 2': 'Page 2',
              },
            });
          });
        });
      });

      describe('when there are filter groups', () => {
        it('should create translations for them', async () => {
          const config: SaveSettingsInput = {
            site_name: 'My collection',
            filters: [
              { id: '1', name: 'Judge' },
              { id: '2', name: 'Documents', items: [{ id: '3', name: 'Cause' }] },
            ],
          };
          await saveSettings(config);
          expect(updateContextExecute).toHaveBeenCalledWith({
            context: { id: 'Filters', label: 'Filters', type: 'Uwazi UI' },
            keyChanges: {},
            keysToDelete: [],
            valueChanges: { Documents: 'Documents' },
          });
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
          await saveSettings(config);
          config = {
            site_name: 'My collection',
            filters: [
              { id: '1', name: 'Judge' },
              { id: '2', name: 'Important Documents', items: [] },
            ],
          };
          await saveSettings(config);
          expect(updateContextExecute).toHaveBeenCalledWith({
            context: { id: 'Filters', label: 'Filters', type: 'Uwazi UI' },
            keyChanges: { Documents: 'Important Documents' },
            keysToDelete: ['Files'],
            valueChanges: { 'Important Documents': 'Important Documents' },
          });
        });
      });

      describe('when no links or filters are present', () => {
        it('should not update contexts translations', async () => {
          await saveSettings({ site_name: 'something that does not have links' });
          expect(updateContextExecute).not.toHaveBeenCalled();
        });
      });
    });

    describe('getPublic / getForAdmin()', () => {
      describe('if there is no settings on the DB', () => {
        it('should return the public payload with tenant flags only', async () => {
          await db.clear(['settings']);
          if (postgresSettings) {
            await testingPG.clear(['settings']);
          }

          const result = await withSettings(async () =>
            SettingsQueryServiceFactory.default().getPublic()
          );
          expect(result.site_name).toBeUndefined();
          expect(result.mailerConfig).toBeUndefined();
          expect(result).toEqual(
            expect.objectContaining({ themeCustomization: expect.any(Boolean) })
          );
        });
      });

      it('should not return secrets on getPublic', async () => {
        const values = await withSettings(async () =>
          SettingsQueryServiceFactory.default().getPublic()
        );
        expect(values.publicFormDestination).not.toBeDefined();
        expect(values.mailerConfig).not.toBeDefined();
        expect(values).not.toHaveProperty('sync');
      });

      it('should include admin-only fields on getForAdmin but never sync', async () => {
        const values = await getSettings();
        expect(values.publicFormDestination).toBe('http://example.com/submit');
        expect(values.mailerConfig).toBeDefined();
        expect(values.sync).not.toBeDefined();
      });

      describe('if there is settings with no map starting point on the DB', () => {
        it('should return the default starting point', async () => {
          const settingsFromModel = await getSettings();
          const SWITZERLAND_COORDINATES = [{ lat: 46, lon: 6 }];
          expect(settingsFromModel.mapStartingPoint).toEqual(SWITZERLAND_COORDINATES);
        });
      });

      describe('if map starting point is set to empty array on the DB', () => {
        it('should return the default starting point', async () => {
          await saveSettings({ mapStartingPoint: [] });
          const settingsFromModel = await getSettings();
          const SWITZERLAND_COORDINATES = [{ lat: 46, lon: 6 }];
          expect(settingsFromModel.mapStartingPoint).toEqual(SWITZERLAND_COORDINATES);
        });
      });
    });

    describe('setDefaultLanguage()', () => {
      it('should save the settings with the new default language', async () => {
        await withSettings(async () =>
          SetDefaultLanguageUseCaseFactory.default().execute({ key: 'en' })
        );
        const result = await getSettings();
        expect(result.languages?.[1].key).toBe('en');
        expect(result.languages?.[1].default).toBe(true);
      });
    });

    describe('removeTemplateFromFilters', () => {
      it('should remove the template from the filters', async () => {
        await saveSettings({
          filters: [
            { id: '123', name: 'Template' },
            { id: 'axz', name: 'Group', items: [{ id: '123', name: 'Template' }] },
          ],
        });
        await withSettings(async () =>
          RemoveTemplateFromFiltersUseCaseFactory.default().execute({ templateId: '123' })
        );
        expect((await getSettings()).filters).toEqual([{ id: 'axz', name: 'Group', items: [] }]);
      });
    });

    describe('updateFilterName', () => {
      it('should update a filter name', async () => {
        await saveSettings({ filters: [{ id: '123', name: 'Batman' }] });
        const updated = await withSettings(async () =>
          UpdateFilterNameUseCaseFactory.default().execute({
            filterId: '123',
            name: 'The dark knight',
          })
        );

        expect(updated).toBe(true);
        expect((await getSettings()).filters).toEqual([{ id: '123', name: 'The dark knight' }]);
      });

      it('should do nothing when filter does not exist', async () => {
        await saveSettings({ filters: [{ id: '123', name: 'Batman' }] });
        const updated = await withSettings(async () =>
          UpdateFilterNameUseCaseFactory.default().execute({
            filterId: '321',
            name: 'Filter not present',
          })
        );

        expect(updated).toBe(false);
        expect((await getSettings()).filters).toEqual([{ id: '123', name: 'Batman' }]);
      });
    });

    describe('getLinks', () => {
      it('should return the links', async () => {
        await setUpSettings(linkFixtures);
        const result = (await getSettings()).links || [];
        expect(JSON.parse(JSON.stringify(result))).toEqual(
          JSON.parse(JSON.stringify(linkFixtures.settings?.[0].links))
        );
      });
    });

    describe('saveLinks', () => {
      it('should save the links', async () => {
        await setUpSettings();
        await withSettings(async () =>
          SaveMenuItemsUseCaseFactory.default().execute({ links: newLinks })
        );
        const result = (await getSettings()).links || [];
        const serialize = (value: unknown) => JSON.parse(JSON.stringify(value));
        expect(serialize(result)).toEqual(
          serialize(newLinks).map((link: { sublinks?: Record<string, unknown>[] }) =>
            link.sublinks?.length
              ? {
                  ...link,
                  sublinks: link.sublinks.map(sublink => ({
                    ...sublink,
                    _id: expect.any(String),
                  })),
                }
              : link
          )
        );
      });
    });
  });
});
