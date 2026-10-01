// oxlint-disable max-statements
import { Client } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';

const COLUMNS = `"name", "dbName", "indexName", "uploadedDocuments", "attachments", "customUploads", "activityLogs"`;

const insertTenant = (name: string) =>
  `INSERT INTO tenants (${COLUMNS}) VALUES ('${name}', '${name}_db', '${name}_index', 'a', 'b', 'c', 'd')`;

describe('026-create-tenants-version', () => {
  let app: Client;

  const version = async () => {
    const { rows } = await app.query('SELECT "version" FROM tenants_version');
    return Number(rows[0].version);
  };

  const bumpsOf = async (write: string) => {
    const before = await version();
    await app.query(write);
    return (await version()) - before;
  };

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
    app = new Client(testingPG.appConfig);
    await app.connect();
  });

  afterAll(async () => {
    await app.end();
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await app.query('DELETE FROM tenants');
    await app.query(insertTenant('one'));
  });

  it('should keep a single counter row', async () => {
    const { rows } = await app.query('SELECT "id", "version" FROM tenants_version');

    expect(rows).toHaveLength(1);
    await expect(app.query('INSERT INTO tenants_version ("id") VALUES (false)')).rejects.toThrow();
  });

  it('should count an inserted tenant', async () => {
    expect(await bumpsOf(insertTenant('two'))).toBe(1);
  });

  it('should count a deleted tenant', async () => {
    expect(await bumpsOf(`DELETE FROM tenants WHERE "name" = 'one'`)).toBe(1);
  });

  it('should count a truncated registry', async () => {
    const before = await version();

    await testingEnvironment.pg.pool?.query('TRUNCATE tenants');

    expect((await version()) - before).toBe(1);
  });

  it.each([
    ['a feature flag', `"featureFlags" = '{"postgresCore": true}'`],
    ['maintenance', `"maintenance" = true`],
    ['the domain', `"domain" = 'one.uwazi.io'`],
    ['a storage path', `"attachments" = 'elsewhere'`],
    ['the matomo settings', `"globalMatomo" = '{"id": "1", "url": "https://m.org"}'`],
  ])('should count a change to %s', async (_field, set) => {
    expect(await bumpsOf(`UPDATE tenants SET ${set}`)).toBe(1);
  });

  it.each([
    ['stats', `"stats" = '{"lastUpdated": 1}'`],
    ['health checks', `"healthChecks" = '[{"name": "disk"}]'`],
    ['metadata', `"metadata" = '{"orgName": "Acme"}'`],
    ['extras', `"extras" = '{"status": "ready"}'`],
    ['the update time', `"updatedAt" = now()`],
  ])('should not count a change to %s', async (_field, set) => {
    expect(await bumpsOf(`UPDATE tenants SET ${set}`)).toBe(0);
  });

  it('should not count a write that stores the same registry values', async () => {
    await app.query(`UPDATE tenants SET "maintenance" = true`);

    expect(await bumpsOf(`UPDATE tenants SET "maintenance" = true`)).toBe(0);
  });

  it('should not count an upsert that only changes operational data', async () => {
    const upsert = `INSERT INTO tenants (${COLUMNS}, "stats")
      VALUES ('one', 'one_db', 'one_index', 'a', 'b', 'c', 'd', '{"lastUpdated": 2}')
      ON CONFLICT ("name") DO UPDATE SET
        "dbName" = EXCLUDED."dbName", "indexName" = EXCLUDED."indexName",
        "uploadedDocuments" = EXCLUDED."uploadedDocuments", "attachments" = EXCLUDED."attachments",
        "customUploads" = EXCLUDED."customUploads", "activityLogs" = EXCLUDED."activityLogs",
        "stats" = EXCLUDED."stats"`;

    expect(await bumpsOf(upsert)).toBe(0);
  });

  it('should count an upsert that inserts a new tenant', async () => {
    const upsert = `${insertTenant('three')} ON CONFLICT ("name") DO UPDATE SET "stats" = '{}'`;

    expect(await bumpsOf(upsert)).toBe(1);
  });
});
