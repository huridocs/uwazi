import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { CachedMongoSettingsDataSource } from '#api/core/infrastructure/mongodb/CachedMongoSettingsDataSource.js';
import { MongoSettingsDataSource } from '#api/core/infrastructure/mongodb/MongoSettingsDataSource.js';
import { PostgresSettingsDataSource } from '#api/core/infrastructure/postgresql/settings/PostgresSettingsDataSource.js';
import { SettingsDataSourceFactory } from '../SettingsDataSourceFactory.js';

describe('SettingsDataSourceFactory', () => {
  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should return the mongo data source when postgres flag is off', async () => {
    await testingEnvironment.setUp({ settings: [{ site_name: 'Mongo' }] });

    const sut = testingEnvironment.runWithContext(() => SettingsDataSourceFactory.default());

    expect(sut).toBeInstanceOf(MongoSettingsDataSource);
  });

  it('should return the cached mongo data source when postgres flag is off', async () => {
    await testingEnvironment.setUp({ settings: [{ site_name: 'Mongo' }] });

    const sut = testingEnvironment.runWithContext(() => SettingsDataSourceFactory.cached());

    expect(sut).toBeInstanceOf(CachedMongoSettingsDataSource);
  });

  it('should return the postgres data source when postgres flag is on', async () => {
    await testingEnvironment.setUp({ settings: [{ site_name: 'PG' }] }, { postgres: true });

    const sut = testingEnvironment.runWithContext(() => SettingsDataSourceFactory.default(), {
      tenant: {
        ...testingTenants.current(),
        featureFlags: { postgresSettings: true },
      },
    });

    expect(sut).toBeInstanceOf(PostgresSettingsDataSource);
  });

  it('should return the postgres data source from cached() when postgres flag is on', async () => {
    await testingEnvironment.setUp({ settings: [{ site_name: 'PG' }] }, { postgres: true });

    const sut = testingEnvironment.runWithContext(() => SettingsDataSourceFactory.cached(), {
      tenant: {
        ...testingTenants.current(),
        featureFlags: { postgresSettings: true },
      },
    });

    expect(sut).toBeInstanceOf(PostgresSettingsDataSource);
  });
});
