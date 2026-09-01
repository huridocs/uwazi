import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { SettingsSyncHandler } from '../SettingsSyncHandler.js';

const fixtures: DBFixture = {
  settings: [
    {
      site_name: 'Target tenant',
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
};

const testConfigs = [
  { name: 'Mongo', postgresSettings: false },
  { name: 'Postgres', postgresSettings: true },
];

describe('SettingsSyncHandler', () => {
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

    const createSut = () =>
      testingEnvironment.runWithContext(
        () => new SettingsSyncHandler(SettingsDataSourceFactory.default()),
        settingsContext()
      );

    beforeEach(async () => {
      await testingEnvironment.setUp(fixtures, {
        postgres: true,
        postgresMirror: postgresSettings ? ['settings'] : [],
      });
    });

    it('should apply inbound languages onto the existing singleton _id', async () => {
      const sut = createSut();
      const current = await sut.getById('ignored');
      const saved = await sut.save({
        _id: 'master-id',
        languages: [
          { key: 'en', label: 'English', default: true },
          { key: 'es', label: 'Spanish' },
        ],
      });

      expect(String(saved._id)).toEqual(String(current?._id));
      expect(saved.site_name).toBe('Target tenant');
      expect(saved.languages?.map(language => language.key)).toEqual(['en', 'es']);
    });

    it('should reject deleting the settings singleton', async () => {
      const sut = createSut();
      await expect(sut.delete('any')).rejects.toThrow(
        'SettingsSyncHandler: deleting the settings singleton is not supported'
      );
    });
  });
});
