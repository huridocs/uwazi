import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '../../MigrateCollectionToPostgres.js';
import { SettingsMigrationConfig } from '../SettingsMigrationConfig.js';

describe('SettingsMigrationConfig', () => {
  const mongoSettingsDoc = (id: ObjectId) => ({
    _id: id,
    __v: 7,
    site_name: 'Uwazi',
    customCSS: 'body {}',
    mailerConfig: 'smtp://x',
    contactEmail: 'a@b.c',
    dateFormat: 'YYYY',
    languages: [{ key: 'en', label: 'English', default: true }],
  });

  it('should target the settings collection and preserve the mongo _id', () => {
    const id = new ObjectId();
    const mapped = SettingsMigrationConfig.mapDocument(mongoSettingsDoc(id));

    expect(SettingsMigrationConfig.mongoCollection).toBe('settings');
    expect(SettingsMigrationConfig.pgTable).toBe('settings');
    expect(mapped._id).toBe(id.toHexString());
    expect(mapped).not.toHaveProperty('__v');
  });

  it('should map slice columns, JSONB groups, and extras', () => {
    const mapped = SettingsMigrationConfig.mapDocument(mongoSettingsDoc(new ObjectId()));

    expect(mapped.site_name).toBe('Uwazi');
    expect(mapped.custom_css).toBe('body {}');
    expect(mapped.mail).toEqual({ mailerConfig: 'smtp://x', contactEmail: 'a@b.c' });
    expect(mapped.extras).toEqual({ dateFormat: 'YYYY' });
    expect(mapped.languages).toEqual([{ key: 'en', label: 'English', default: true }]);
  });

  it('should stringify a non-ObjectId _id', () => {
    const mapped = SettingsMigrationConfig.mapDocument({
      _id: 'abc123',
      site_name: 'Named',
    });

    expect(mapped._id).toBe('abc123');
  });
});

describe('SettingsMigrationConfig copy', () => {
  const TENANT = 'settings-migration-tenant';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['settings']);
    await testingPG.clear(['settings']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const makeMigrator = () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    return new MigrateCollectionToPostgres(mongoDb, TENANT);
  };

  it('should copy the singleton when the tenant has exactly one mongo document', async () => {
    const id = new ObjectId();
    await testingDB.db(testingDB.dbName).collection('settings').insertOne({
      _id: id,
      site_name: 'Copied',
      dateFormat: 'DD/MM',
      mailerConfig: 'smtp://secret',
    });

    const result = await makeMigrator().migrate(SettingsMigrationConfig);

    expect(result).toEqual({ migrated: 1, skipped: false });

    const rows = (await testingPG.getAllFrom('settings')).filter(row => row.tenant_id === TENANT);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      _id: id.toHexString(),
      site_name: 'Copied',
      extras: { dateFormat: 'DD/MM' },
      mail: { mailerConfig: 'smtp://secret' },
    });
  });

  it('should throw when the tenant has no mongo settings document', async () => {
    await expect(makeMigrator().migrate(SettingsMigrationConfig)).rejects.toThrow(
      /exactly one settings document/
    );
  });

  it('should throw when the tenant has more than one mongo settings document', async () => {
    await testingDB
      .db(testingDB.dbName)
      .collection('settings')
      .insertMany([{ site_name: 'One' }, { site_name: 'Two' }]);

    await expect(makeMigrator().migrate(SettingsMigrationConfig)).rejects.toThrow(
      /exactly one settings document/
    );
  });
});
