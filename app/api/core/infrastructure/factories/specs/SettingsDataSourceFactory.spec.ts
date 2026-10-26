import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { CachedMongoSettingsDataSource } from '#api/core/infrastructure/mongodb/CachedMongoSettingsDataSource.js';
import { MongoSettingsDataSource } from '#api/core/infrastructure/mongodb/MongoSettingsDataSource.js';
import { PostgresSettingsDataSource } from '#api/core/infrastructure/postgresql/settings/PostgresSettingsDataSource.js';
import { CachedPostgresSettingsDataSource } from '#api/core/infrastructure/postgresql/settings/CachedPostgresSettingsDataSource.js';
import { SettingsDataSourceFactory } from '../SettingsDataSourceFactory.js';
import { TransactionManagerFactory } from '../TransactionManagerFactory.js';

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
        featureFlags: { postgresCore: true },
      },
    });

    expect(sut).toBeInstanceOf(PostgresSettingsDataSource);
  });

  it('should return the cached postgres data source when postgres flag is on', async () => {
    await testingEnvironment.setUp({ settings: [{ site_name: 'PG' }] }, { postgres: true });

    const sut = testingEnvironment.runWithContext(() => SettingsDataSourceFactory.cached(), {
      tenant: {
        ...testingTenants.current(),
        featureFlags: { postgresCore: true },
      },
    });

    expect(sut).toBeInstanceOf(CachedPostgresSettingsDataSource);
  });

  describe('cached', () => {
    const postgresTenant = () => ({
      tenant: { ...testingTenants.current(), featureFlags: { postgresCore: true } },
    });

    it('should hand out one data source per execution context, so its cache serves the whole request', async () => {
      await testingEnvironment.setUp({ settings: [{ site_name: 'PG' }] }, { postgres: true });

      const [first, second] = testingEnvironment.runWithContext(
        () => [SettingsDataSourceFactory.cached(), SettingsDataSourceFactory.cached()],
        postgresTenant()
      );
      const otherRequest = testingEnvironment.runWithContext(
        () => SettingsDataSourceFactory.cached(),
        postgresTenant()
      );

      expect(first).toBe(second);
      expect(otherRequest).not.toBe(first);
    });

    it('should not share a data source built with a transaction manager override', async () => {
      await testingEnvironment.setUp({ settings: [{ site_name: 'Mongo' }] });

      const [shared, overridden] = testingEnvironment.runWithContext(() => [
        SettingsDataSourceFactory.cached(),
        SettingsDataSourceFactory.cached({ transactionManager: TransactionManagerFactory.mongo() }),
      ]);

      expect(overridden).not.toBe(shared);
    });
  });

  it('should build the postgres data source without an ExecutionContext store', async () => {
    await testingEnvironment.setUp({ settings: [{ site_name: 'PG' }] }, { postgres: true });
    testingTenants.changeCurrentTenant({
      ...testingTenants.current(),
      featureFlags: { postgresCore: true },
    });

    expect(SettingsDataSourceFactory.default()).toBeInstanceOf(PostgresSettingsDataSource);
    expect(SettingsDataSourceFactory.cached()).toBeInstanceOf(CachedPostgresSettingsDataSource);
  });
});
