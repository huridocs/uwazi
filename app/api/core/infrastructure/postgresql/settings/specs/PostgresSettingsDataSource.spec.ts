import { ObjectId } from 'mongodb';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { DefaultLanguageMissingError } from '#api/core/infrastructure/mongodb/errors/settingsErrors.js';
import { LanguageSchema } from '#shared/types/commonTypes.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';
import { PostgresSettingsDataSource } from '../PostgresSettingsDataSource.js';

const TENANT_ID = 'test-tenant';
const SETTINGS_ID = new ObjectId().toHexString();

const managerFor = (tenantId: string) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const makeDS = (
  tenantId = TENANT_ID,
  overrides?: Partial<ConstructorParameters<typeof PostgresSettingsDataSource>[0]>
) =>
  new PostgresSettingsDataSource({
    tenantId,
    mongoDb: getConnection(),
    pgTransactionManager: managerFor(tenantId),
    idGenerator: IdGeneratorFactory.default(),
    ...overrides,
  });

const seedEnglish = async () => {
  const ds = makeDS();
  await ds.patch({
    _id: SETTINGS_ID,
    languages: [{ key: 'en', label: 'English', default: true }],
  });
  return ds;
};

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingEnvironment.setUp({});
  await testingPG.clear(['settings']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresSettingsDataSource', () => {
  it('should patch and read the tenant singleton, preserving unmentioned keys', async () => {
    const ds = makeDS();
    await ds.patch({
      _id: SETTINGS_ID,
      site_name: 'Uwazi',
      customCSS: 'body { color: red }',
      dateFormat: 'YYYY',
    });

    await ds.patch({ site_name: 'Renamed' });

    const settings = await ds.get();
    expect(settings._id).toBe(SETTINGS_ID);
    expect(settings.site_name).toBe('Renamed');
    expect(settings.customCSS).toBe('body { color: red }');
    expect(settings.dateFormat).toBe('YYYY');

    const rows = await testingEnvironment.pg.getAllFrom('settings');
    expect(rows).toHaveLength(1);
  });

  it('should throw when getting a missing singleton', async () => {
    await expect(makeDS().get()).rejects.toThrow('Settings not found');
  });

  it('should mint an id from IdGenerator when creating a singleton without one', async () => {
    const ds = makeDS(TENANT_ID, { idGenerator: { generate: () => 'aaaaaaaaaaaaaaaaaaaaaaaa' } });
    await ds.patch({ site_name: 'Minted' });

    const settings = await ds.get();
    expect(settings._id).toBe('aaaaaaaaaaaaaaaaaaaaaaaa');
    expect(settings.site_name).toBe('Minted');
  });

  it('should project requested fields without loading customCSS', async () => {
    const ds = makeDS();
    await ds.patch({
      _id: SETTINGS_ID,
      languages: [{ key: 'en', label: 'English', default: true }],
      customCSS: 'HUGE',
      mailerConfig: 'smtp://secret',
    });

    const fields = await ds.readFields(['languages']);
    expect(fields).toEqual({
      _id: SETTINGS_ID,
      languages: [{ key: 'en', label: 'English', default: true }],
    });
    expect(fields).not.toHaveProperty('customCSS');
    expect(fields).not.toHaveProperty('mailerConfig');
  });

  it('should read a feature slice and sync config', async () => {
    const ds = makeDS();
    await ds.patch({
      _id: SETTINGS_ID,
      features: { segmentation: { url: 'http://seg' }, favorites: true },
      sync: [{ url: 'http://peer', username: 'u', password: 'p', name: 'peer', config: {} }],
    });

    expect(await ds.readFeature('segmentation')).toEqual({ url: 'http://seg' });
    expect(await ds.readSyncConfig()).toEqual([
      { url: 'http://peer', username: 'u', password: 'p', name: 'peer', config: {} },
    ]);
  });

  it('should add a language on the JSONB column without duplicating it', async () => {
    const ds = await seedEnglish();

    await ds.addLanguage({ key: 'es', label: 'Spanish' });
    await ds.addLanguage({ key: 'es', label: 'Spanish' });

    expect(await ds.getLanguageKeys()).toEqual(['en', 'es']);
    expect(await ds.getDefaultLanguageKey()).toBe('en');
  });

  it('should flag a language as installing', async () => {
    const ds = await seedEnglish();
    await ds.addLanguage({ key: 'es', label: 'Spanish' });

    await ds.setLanguageInstalling('es', true);

    const spanish = (await ds.get()).languages?.find(
      (language: LanguageSchema) => language.key === 'es'
    );
    expect(spanish?.installing).toBe(true);
  });

  it('should delete a language from the JSONB column', async () => {
    const ds = await seedEnglish();
    await ds.addLanguage({ key: 'es', label: 'Spanish' });

    await ds.deleteLanguage('es');

    expect(await ds.getLanguageKeys()).toEqual(['en']);
  });

  it('should throw when no default language is set', async () => {
    const ds = makeDS();
    await ds.patch({
      _id: SETTINGS_ID,
      languages: [{ key: 'en', label: 'English' }],
    });

    await expect(ds.getDefaultLanguageKey()).rejects.toThrow(DefaultLanguageMissingError);
  });

  it('should isolate tenants via RLS', async () => {
    const tenantA = makeDS('tenant-a');
    const tenantB = makeDS('tenant-b');
    const idA = new ObjectId().toHexString();

    await tenantA.patch({ _id: idA, site_name: 'Only A' });

    expect((await tenantA.get()).site_name).toBe('Only A');
    expect(await tenantB.find()).toBeNull();
  });
});
