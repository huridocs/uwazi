import { testingEnvironment } from 'api/utils/testingEnvironment';
import settings from 'api/settings';
import { Languages } from 'api/i18n/languages';
import fixtures from './fixtures';

describe('languages', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, '', true);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('add', () => {
    it('should add the language to the settings', async () => {
      await Languages.add({ key: 'dt', label: 'Deutsch' });

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
