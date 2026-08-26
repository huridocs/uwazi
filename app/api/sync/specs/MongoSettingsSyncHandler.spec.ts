import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { MongoSettingsSyncHandler } from '../MongoSettingsSyncHandler.js';

const createSut = () =>
  testingEnvironment.runWithContext(
    () => new MongoSettingsSyncHandler(SettingsDataSourceFactory.default())
  );

describe('MongoSettingsSyncHandler', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({
      settings: [
        {
          site_name: 'Target tenant',
          languages: [{ key: 'en', label: 'English', default: true }],
        },
      ],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
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

    expect(saved._id).toEqual(current?._id);
    expect(saved.site_name).toBe('Target tenant');
    expect(saved.languages?.map(language => language.key)).toEqual(['en', 'es']);
  });

  it('should reject deleting the settings singleton', async () => {
    const sut = createSut();
    await expect(sut.delete('any')).rejects.toThrow(
      'MongoSettingsSyncHandler: deleting the settings singleton is not supported'
    );
  });
});
