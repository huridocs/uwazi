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

  it('should patch settings without the caller wrapping runWithContext', async () => {
    await SettingsDSWithContext.default().patch({ private: true });

    const settings = await SettingsDSWithContext.default().find();
    expect(settings?.private).toBe(true);
  });
});
