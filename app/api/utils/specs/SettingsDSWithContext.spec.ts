import { testingEnvironment, SettingsDSWithContext } from '#api/utils/testingEnvironment.js';

describe('SettingsDSWithContext', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({
      settings: [
        {
          languages: [{ key: 'en', label: 'English', default: true }],
          private: false,
        },
      ],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should get and update settings without the caller wrapping runWithContext', async () => {
    const dataSource = SettingsDSWithContext.default();
    const settings = await dataSource.get();
    settings.apply({ private: true }, () => '');
    await dataSource.update(settings);

    expect((await dataSource.find())?.isPrivate).toBe(true);
  });
});
