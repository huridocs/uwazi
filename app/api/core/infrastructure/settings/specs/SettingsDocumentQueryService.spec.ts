import { SettingsDocumentQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsDocumentQueryServiceFactory.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import type { Settings } from '#shared/types/settingsType.js';

const f = getFixturesFactory();

const SETTINGS_ID = f.id('settings');
const LANGUAGE_ID = f.id('english');
const LINK_ID = f.id('home-link');

const known: Settings = {
  _id: SETTINGS_ID,
  site_name: 'Uwazi',
  languages: [{ _id: LANGUAGE_ID, key: 'en', label: 'English', default: true }],
  links: [{ _id: LINK_ID, title: 'Home', url: '/', type: 'link' }],
  features: { ocr: { url: 'http://ocr' }, favorites: true },
  sync: [
    {
      url: 'http://target',
      username: 'sync-user',
      password: 'sync-secret',
      name: 'target',
      active: true,
      config: {},
    },
  ],
};

/** A field the settings type does not know: kept in Mongo as is, in Postgres `extras`. */
const unknownFields = { legacyField: { kept: true } };

/** The whole document as stored, secrets and fields the settings schema does not know included. */
const stored: Settings = { ...known, ...unknownFields };

/**
 * Both backends answer in the shape settings are written in: menu items identified by `id`,
 * languages without a subdocument `_id`. Otherwise untouched.
 */
const expected = {
  _id: SETTINGS_ID.toString(),
  site_name: 'Uwazi',
  languages: [{ key: 'en', label: 'English', default: true }],
  links: [{ id: LINK_ID.toString(), title: 'Home', url: '/', type: 'link' }],
  features: { ocr: { url: 'http://ocr' }, favorites: true },
  sync: [
    {
      url: 'http://target',
      username: 'sync-user',
      password: 'sync-secret',
      name: 'target',
      active: true,
      config: {},
    },
  ],
  legacyField: { kept: true },
};

const backends = [
  { name: 'Mongo', postgresCore: false },
  { name: 'Postgres', postgresCore: true },
];

describe('SettingsDocumentQueryService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(backends)('$name', ({ postgresCore }) => {
    const useBackend = () => testingTenants.changeCurrentTenant({ featureFlags: { postgresCore } });

    const get = async () =>
      testingEnvironment.runWithContext(async () =>
        SettingsDocumentQueryServiceFactory.default().get()
      );

    it('should return the whole stored document, sync and unknown fields included', async () => {
      await testingEnvironment.setFixtures({ settings: [stored] });
      useBackend();

      expect(await get()).toEqual(expected);
    });

    it('should not fill in defaults', async () => {
      await testingEnvironment.setFixtures({ settings: [stored] });
      useBackend();

      expect(await get()).not.toHaveProperty('mapStartingPoint');
    });

    it('should return plain JSON, with ids as strings', async () => {
      await testingEnvironment.setFixtures({ settings: [stored] });
      useBackend();

      const document = await get();

      expect(JSON.parse(JSON.stringify(document))).toEqual(document);
    });

    it('should return undefined when the tenant has no settings', async () => {
      await testingEnvironment.setFixtures({ settings: [] });
      useBackend();

      expect(await get()).toBeUndefined();
    });
  });
});
