import { ObjectId } from 'mongodb';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { Settings } from '#api/core/domain/settings/Settings.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';
import { PostgresSettingsDataSource } from '../PostgresSettingsDataSource.js';
import { CachedPostgresSettingsDataSource } from '../CachedPostgresSettingsDataSource.js';

const TENANT_ID = 'test-tenant';
const SETTINGS_ID = new ObjectId().toHexString();

const deps = (pgTransactionManager: PostgresTransactionManager) => ({
  tenantId: TENANT_ID,
  pgTransactionManager,
  accessContext: AccessContext.system(),
  idGenerator: IdGeneratorFactory.default(),
});

const newManager = () =>
  new PostgresTransactionManager(PostgresDB.pipelinedPool(), TENANT_ID, LoggerFactory.forTests());

const recordSettingsReads = () => {
  const reads: string[] = [];
  const stop = PostgresDB.onStatement(sql => {
    if (/select [^;]* from "settings"/i.test(sql)) reads.push(sql);
  });
  return { reads, stop };
};

const seed = async () =>
  new PostgresSettingsDataSource(deps(newManager())).update(
    new Settings({
      _id: SETTINGS_ID,
      site_name: 'Uwazi',
      newNameGeneration: true,
      filterUnauthorizedRelated: true,
      languages: [{ key: 'en', label: 'English', default: true }],
      sync: [{ url: 'http://sync.target', active: true } as any],
    })
  );

const renameSite = async (ds: PostgresSettingsDataSource, siteName: string) => {
  const current = await ds.get();
  current.apply({ site_name: siteName }, () => 'unused');
  await ds.update(current);
};

const allReads = async (ds: PostgresSettingsDataSource) => ({
  find: (await ds.find())?.toState(),
  presentation: (await ds.readPresentation())?.toState(),
  languages: await ds.readLanguages(),
  languageKeys: await ds.getLanguageKeys(),
  defaultLanguage: await ds.getDefaultLanguageKey(),
  newNameGeneration: await ds.readNewNameGeneration(),
  filterUnauthorizedRelated: await ds.readFilterUnauthorizedRelated(),
  sync: await ds.readSyncConfig(),
  contactMail: await ds.readContactMail(),
});

describe('CachedPostgresSettingsDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingPG.clear(['settings']);
    await seed();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should answer every read with what the uncached data source returns', async () => {
    const manager = newManager();

    const cached = await allReads(new CachedPostgresSettingsDataSource(deps(manager)));
    const uncached = await allReads(new PostgresSettingsDataSource(deps(manager)));

    expect(cached).toEqual(uncached);
    expect(cached.presentation).not.toHaveProperty('sync');
  });

  it('should read the settings row from the database once for any number of reads', async () => {
    const ds = new CachedPostgresSettingsDataSource(deps(newManager()));
    const recorder = recordSettingsReads();

    await allReads(ds);
    await allReads(ds);
    recorder.stop();

    expect(recorder.reads).toHaveLength(1);
  });

  it('should return what it wrote itself on the next read', async () => {
    const ds = new CachedPostgresSettingsDataSource(deps(newManager()));
    await ds.get();

    await renameSite(ds, 'Renamed');

    expect((await ds.get()).toState().site_name).toBe('Renamed');
  });

  it('should leave no tenant on the connection after a read', async () => {
    await new CachedPostgresSettingsDataSource(deps(newManager())).readLanguages();

    const leftovers = await Promise.all(
      Array.from({ length: 10 }, async () =>
        PostgresDB.pipelinedPool().query(
          "SELECT current_setting('app.current_tenant', true) AS tenant"
        )
      )
    );

    expect(leftovers.map(result => result.rows[0].tenant ?? '')).not.toContain(TENANT_ID);
  });

  it('should read through to the database inside a write transaction', async () => {
    const manager = newManager();
    const ds = new CachedPostgresSettingsDataSource(deps(manager));
    await ds.get();

    const seenInside = await manager.run(async () => {
      await renameSite(new PostgresSettingsDataSource(deps(manager)), 'Inside');
      return (await ds.get()).toState().site_name;
    });

    expect(seenInside).toBe('Inside');
  });

  it('should drop what it holds once a write transaction commits', async () => {
    const manager = newManager();
    const ds = new CachedPostgresSettingsDataSource(deps(manager));
    await ds.get();

    await manager.run(async () =>
      renameSite(new PostgresSettingsDataSource(deps(manager)), 'Committed')
    );

    expect((await ds.get()).toState().site_name).toBe('Committed');
  });
});
