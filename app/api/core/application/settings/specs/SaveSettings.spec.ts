// oxlint-disable max-statements, max-lines
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { TranslationsService } from '#api/core/application/translation/TranslationsService.js';
import { TranslationsServiceFactory } from '#api/core/infrastructure/factories/TranslationsServiceFactory.js';
import { SaveSettingsUseCaseFactory } from '#api/core/infrastructure/factories/SaveSettingsUseCaseFactory.js';
import { SetDefaultLanguageUseCaseFactory } from '#api/core/infrastructure/factories/SetDefaultLanguageUseCaseFactory.js';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';
import { SettingsServiceFactory } from '#api/core/infrastructure/factories/SettingsServiceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { User } from '#api/users.v2/model/User.js';
import db from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { SaveSettingsInput } from '../../SaveSettings.js';
import fixtures, { factory, linkFixtures, newLinks } from './fixtures.js';
import {
  clearJobs,
  ensureBroadcastSettingsChangedRegistered,
  expectSettingsChangedJob,
} from './settingsChangedJob.js';

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

    const adminActor = User.createFrom({
      _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      role: 'admin',
      groups: [],
    });

    const withSettings = <T>(fn: () => T) =>
      testingEnvironment.runWithContext(fn, { ...settingsContext(), actor: adminActor });

    const withRealEmitter = <T>(fn: () => T) =>
      testingEnvironment.runWithContext(fn, {
        ...settingsContext(),
        actor: adminActor,
        factories: { eventEmitter: () => EventEmitterFactory.default() },
      });

    const saveSettings = async (input: SaveSettingsInput) =>
      withSettings(async () => SaveSettingsUseCaseFactory.default().execute(input));
    const getSettings = async () =>
      withSettings(async () => SettingsQueryServiceFactory.default().get());

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

      it('should throw when the singleton does not exist', async () => {
        await db.clear(['settings']);
        if (postgresSettings) {
          await testingPG.clear(['settings']);
        }

        await expect(saveSettings({ site_name: 'Nope' })).rejects.toThrow('Settings not found');
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

        it('should persist menu items by id and not mint a mongoose subdocument _id', async () => {
          await saveSettings({
            links: [{ title: 'Home', type: 'link', url: '/' }],
          });

          const { links } = await getSettings();
          expect(links).toEqual([
            { id: expect.any(String), title: 'Home', type: 'link', url: '/' },
          ]);
          expect(links?.[0]).not.toHaveProperty('_id');
        });

        it('should drop leftover menu _id on save', async () => {
          await saveSettings({
            links: [
              {
                _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
                id: 'menu1',
                title: 'Home',
                type: 'link',
                url: '/',
              },
            ],
          });

          expect((await getSettings()).links).toEqual([
            { id: 'menu1', title: 'Home', type: 'link', url: '/' },
          ]);
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
                  id: savedConfig.links?.[0].id,
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
                  id: savedConfig.links?.[0].id,
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

          it('should match menu translations by id when stored items still have mongoose _id', async () => {
            await setUpSettings(linkFixtures);
            jest.clearAllMocks();
            await saveSettings({
              links: [
                {
                  id: factory.idString('link'),
                  title: 'Renamed link',
                  type: 'link',
                  url: 'http://uwazi.io',
                  sublinks: [],
                },
                {
                  id: factory.idString('group'),
                  title: 'Group',
                  type: 'group',
                  sublinks: [
                    {
                      id: factory.idString('sublink1'),
                      title: 'Sublink1',
                      url: 'page/pageid/sublink1',
                      type: 'link',
                      localId: 'sublink1',
                    },
                    {
                      id: factory.idString('sublink2'),
                      title: 'Sublink2',
                      url: 'page/pageid2/sublink2',
                      type: 'link',
                      localId: 'sublink2',
                    },
                  ],
                },
              ],
            });

            expect(updateContextExecute).toHaveBeenCalledWith({
              context: { id: 'Menu', label: 'Menu', type: 'Uwazi UI' },
              keyChanges: { Link: 'Renamed link' },
              keysToDelete: [],
              valueChanges: {
                'Renamed link': 'Renamed link',
                Group: 'Group',
                Sublink1: 'Sublink1',
                Sublink2: 'Sublink2',
              },
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
                  id: savedConfig.links?.[0].id,
                },
                {
                  title: 'Group one',
                  type: 'group' as 'group',
                  sublinks: [
                    {
                      title: 'Page 2',
                      type: 'link' as 'link',
                      url: 'url2',
                      id: savedConfig.links?.[1].id,
                    },
                  ],
                  id: savedConfig.links?.[2].id,
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
        it('should persist filters by id and not mint a mongoose subdocument _id', async () => {
          await saveSettings({
            filters: [
              { id: '123', name: 'Template' },
              { id: 'grp', name: 'Group', items: [{ id: '456', name: 'Nested' }] },
            ],
          });

          expect((await getSettings()).filters).toEqual([
            { id: '123', name: 'Template' },
            { id: 'grp', name: 'Group', items: [{ id: '456', name: 'Nested' }] },
          ]);
        });

        it('should drop leftover filter _id on save', async () => {
          await saveSettings({
            filters: [{ _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', id: '123', name: 'Template' }],
          });

          expect((await getSettings()).filters).toEqual([{ id: '123', name: 'Template' }]);
        });

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

    describe('get() / forBroadcast()', () => {
      describe('if there is no settings on the DB', () => {
        it('should return the public payload with tenant flags only', async () => {
          await db.clear(['settings']);
          if (postgresSettings) {
            await testingPG.clear(['settings']);
          }

          const result = await withSettings(async () =>
            SettingsQueryServiceFactory.default().forBroadcast()
          );
          expect(result.site_name).toBeUndefined();
          expect(result.mailerConfig).toBeUndefined();
          expect(result).toEqual(
            expect.objectContaining({ themeCustomization: expect.any(Boolean) })
          );
        });
      });

      it('should not return secrets on forBroadcast', async () => {
        const values = await withSettings(async () =>
          SettingsQueryServiceFactory.default().forBroadcast()
        );
        expect(values.publicFormDestination).not.toBeDefined();
        expect(values.mailerConfig).not.toBeDefined();
        expect(values).not.toHaveProperty('sync');
      });

      it('should include admin-only fields on get() but never sync', async () => {
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

    describe('SettingsChangedEvent', () => {
      beforeEach(() => {
        ensureBroadcastSettingsChangedRegistered();
      });

      it('should enqueue BroadcastSettingsChanged when settings are saved', async () => {
        await clearJobs();
        await withRealEmitter(async () =>
          SaveSettingsUseCaseFactory.default().execute({
            site_name: 'Broadcasted collection',
          })
        );
        await expectSettingsChangedJob();
      });

      it('should enqueue BroadcastSettingsChanged when the default language changes', async () => {
        await clearJobs();
        await withRealEmitter(async () =>
          SetDefaultLanguageUseCaseFactory.default().execute({ key: 'en' })
        );
        await expectSettingsChangedJob();
      });

      it('should enqueue BroadcastSettingsChanged when a filter is renamed', async () => {
        await saveSettings({ filters: [{ id: '123', name: 'Batman' }] });
        await clearJobs();
        await withRealEmitter(async () =>
          ExecutionContext.transactionManager.run(async () =>
            SettingsServiceFactory.default().updateFilterName('123', 'The dark knight')
          )
        );
        await expectSettingsChangedJob();
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
          ExecutionContext.transactionManager.run(async () =>
            SettingsServiceFactory.default().removeTemplateFromFilters('123')
          )
        );
        expect((await getSettings()).filters).toEqual([{ id: 'axz', name: 'Group', items: [] }]);
      });
    });

    describe('updateFilterName', () => {
      it('should update a filter name', async () => {
        await saveSettings({ filters: [{ id: '123', name: 'Batman' }] });
        const updated = await withSettings(async () =>
          ExecutionContext.transactionManager.run(async () =>
            SettingsServiceFactory.default().updateFilterName('123', 'The dark knight')
          )
        );

        expect(updated).toBe(true);
        expect((await getSettings()).filters).toEqual([{ id: '123', name: 'The dark knight' }]);
      });

      it('should do nothing when filter does not exist', async () => {
        await saveSettings({ filters: [{ id: '123', name: 'Batman' }] });
        const updated = await withSettings(async () =>
          ExecutionContext.transactionManager.run(async () =>
            SettingsServiceFactory.default().updateFilterName('321', 'Filter not present')
          )
        );

        expect(updated).toBe(false);
        expect((await getSettings()).filters).toEqual([{ id: '123', name: 'Batman' }]);
      });
    });

    describe('getLinks', () => {
      it('should expose menu item id from leftover mongoose _id without requiring a save', async () => {
        await setUpSettings(linkFixtures);
        const result = (await getSettings()).links || [];
        expect(result[0]).toEqual(
          expect.objectContaining({
            id: factory.idString('link'),
            title: 'Link',
          })
        );
        expect(result[0]).not.toHaveProperty('_id');
        expect(result[1]).toEqual(
          expect.objectContaining({
            id: factory.idString('group'),
            title: 'Group',
          })
        );
        expect(result[1]?.sublinks?.[0]).toEqual(
          expect.objectContaining({
            id: factory.idString('sublink1'),
            title: 'Sublink1',
          })
        );
      });
    });

    describe('saveLinks', () => {
      it('should save the links', async () => {
        await setUpSettings();
        await withSettings(async () =>
          SaveSettingsUseCaseFactory.default().execute({ links: newLinks })
        );
        const result = (await getSettings()).links || [];
        const serialize = (value: unknown) => JSON.parse(JSON.stringify(value));
        const asPersistedMenuItem = (link: {
          _id?: unknown;
          sublinks?: Record<string, unknown>[];
          [key: string]: unknown;
        }) => {
          const { _id, sublinks, ...rest } = link;
          return {
            ...rest,
            id: String(_id),
            ...(sublinks
              ? {
                  sublinks: sublinks.map(sublink => {
                    const { _id: subId, ...subRest } = sublink;
                    return {
                      ...subRest,
                      id: subId ? String(subId) : expect.any(String),
                    };
                  }),
                }
              : {}),
          };
        };
        expect(serialize(result)).toEqual(serialize(newLinks).map(asPersistedMenuItem));
      });
    });
  });
});
