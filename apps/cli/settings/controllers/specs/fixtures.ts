import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import type { Settings } from '#shared/types/settingsType.js';

const f = getFixturesFactory();

const settings: Settings = {
  _id: f.id('settings'),
  site_name: 'Uwazi',
  languages: [{ key: 'en', label: 'English', default: true }],
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

const fixtures: DBFixture = { settings: [settings] };

/** The fixture as the CLI prints it: plain JSON. */
const printed = JSON.parse(JSON.stringify(settings));

export { f, fixtures, printed };
