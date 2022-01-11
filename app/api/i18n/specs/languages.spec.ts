import { Languages } from 'api/i18n/languages';
import { testingDB } from 'api/utils/testing_db';
import settings from 'api/settings';
import fixtures from './fixtures';

describe('languages', () => {
  beforeEach(async () => {
    await testingDB.clearAllAndLoad(fixtures);
  });

  describe('add', () => {
    beforeAll(async () => {
      await Languages.add({ key: 'dt', label: 'Deutsch' });
    });

    it('should add the language to the settings', async () => {
      const currentSettings = await settings.get();
      expect(currentSettings.languages).toMatchObject([
        {
          key: 'es',
          label: 'Español',
        },
        {
          key: 'en',
          label: 'English',
          default: true,
        },
        {
          key: 'dt',
          label: 'Deutsch',
        },
      ]);
    });
  });
});
