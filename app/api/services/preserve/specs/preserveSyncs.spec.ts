/* eslint-disable max-statements */
import { testingDB } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { preserveSyncs } from '../preserveSyncs.js';

const TOKEN = 'auth-token';
const OTHER = 'another-auth-token';
const FIRST = '2020-01-01T00:00:00.000Z';
const SECOND = '2020-06-01T00:00:00.000Z';

const backends = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('preserveSyncs', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(backends)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: usePostgres } });
      await testingDB.clear(['preservesyncs']);
      await testingPG.clear(['preserve_sync']);
    });

    const run = async <T>(fn: () => Promise<T>) => testingEnvironment.runWithContext(fn);

    const stored = async () => {
      if (usePostgres) {
        const rows = await testingPG.getAllFrom<{
          token: string;
          last_import: string;
          tenant_id: string;
        }>('preserve_sync');
        return rows
          .filter(row => row.tenant_id === testingTenants.current().name)
          .map(row => ({ token: row.token, lastImport: row.last_import }));
      }

      const rows = await testingDB
        .db(testingDB.dbName)
        .collection('preservesyncs')
        .find({})
        .toArray();
      return rows.map(row => ({
        token: row.token as string,
        lastImport: row.lastImport as string,
      }));
    };

    it('should create a cursor and replace it for the same token', async () => {
      await run(async () => preserveSyncs.save(TOKEN, FIRST));
      await run(async () => preserveSyncs.save(TOKEN, SECOND));
      await run(async () => preserveSyncs.save(OTHER, FIRST));

      const rows = await stored();
      expect(rows).toHaveLength(2);
      expect(rows).toEqual(
        expect.arrayContaining([
          { token: TOKEN, lastImport: SECOND },
          { token: OTHER, lastImport: FIRST },
        ])
      );
    });

    it('should read the stored import date', async () => {
      await run(async () => preserveSyncs.save(TOKEN, FIRST));

      expect(await run(async () => preserveSyncs.read(TOKEN))).toEqual({ lastImport: FIRST });
    });

    it('should read nothing when that token has no cursor', async () => {
      await run(async () => preserveSyncs.save(OTHER, FIRST));

      expect(await run(async () => preserveSyncs.read(TOKEN))).toBeNull();
    });
  });

  describe('tenant isolation', () => {
    const otherTenant = 'other-preserve-tenant';

    beforeEach(async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: true } });
      await testingDB.clear(['preservesyncs']);
      await testingPG.clear(['preserve_sync']);
      await testingPG.pool!.query(
        `INSERT INTO preserve_sync ("tenant_id", "token", "last_import") VALUES ($1, $2, $3)`,
        [otherTenant, TOKEN, '2019-01-01T00:00:00.000Z']
      );
    });

    const run = async <T>(fn: () => Promise<T>) => testingEnvironment.runWithContext(fn);

    it('should not read or replace another tenant cursor', async () => {
      expect(await run(async () => preserveSyncs.read(TOKEN))).toBeNull();
      await run(async () => preserveSyncs.save(TOKEN, FIRST));

      const foreign = (await testingPG.getAllFrom('preserve_sync')).filter(
        row => row.tenant_id === otherTenant
      );
      expect(foreign).toMatchObject([{ token: TOKEN, last_import: '2019-01-01T00:00:00.000Z' }]);
    });
  });
});
