/* eslint-disable max-statements */
import { testingDB } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { syncs } from '../syncs.js';

const NAME = 'target-a';

const backends = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('syncs', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(backends)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: usePostgres } });
      await testingDB.clear(['syncs']);
      await testingPG.clear(['syncs']);
    });

    const run = async <T>(fn: () => Promise<T>) => testingEnvironment.runWithContext(fn);

    const stored = async () => {
      if (usePostgres) {
        const rows = await testingPG.getAllFrom<{
          name: string;
          last_syncs: Record<string, number>;
          consecutive_failures: number | string;
        }>('syncs');
        return rows
          .filter(row => row.name === NAME)
          .map(row => ({
            lastSyncs: row.last_syncs,
            consecutiveFailures: Number(row.consecutive_failures),
          }));
      }

      const rows = await testingDB
        .db(testingDB.dbName)
        .collection('syncs')
        .find({ name: NAME })
        .toArray();
      return rows.map(row => ({
        lastSyncs: row.lastSyncs as Record<string, number>,
        consecutiveFailures: Number(row.consecutiveFailures ?? 0),
      }));
    };

    it('sets one namespace timestamp and keeps the others', async () => {
      await run(async () => syncs.ensure(NAME));
      await run(async () => syncs.setNamespaceTimestamp(NAME, 'files', 10));
      await run(async () => syncs.setNamespaceTimestamp(NAME, 'entities', 20));

      const [cursor] = await stored();
      expect(cursor.lastSyncs).toEqual({ files: 10, entities: 20 });
    });

    it('resets consecutive failures and keeps the cursor', async () => {
      await run(async () => syncs.ensure(NAME));
      await run(async () => syncs.setNamespaceTimestamp(NAME, 'files', 10));
      await run(async () => syncs.recordFailure(NAME));
      await run(async () => syncs.resetConsecutiveFailures(NAME));

      const [cursor] = await stored();
      expect(cursor).toEqual({ lastSyncs: { files: 10 }, consecutiveFailures: 0 });
    });

    it('increments failures and creates the row when it is missing', async () => {
      const first = await run(async () => syncs.recordFailure(NAME));
      const second = await run(async () => syncs.recordFailure(NAME));

      expect(first).toBe(1);
      expect(second).toBe(2);
      const [cursor] = await stored();
      expect(cursor).toEqual({ lastSyncs: {}, consecutiveFailures: 2 });
    });

    it('does not reset an existing cursor when ensuring the row', async () => {
      await run(async () => syncs.ensure(NAME));
      await run(async () => syncs.setNamespaceTimestamp(NAME, 'files', 10));
      await run(async () => syncs.ensure(NAME));

      const [cursor] = await stored();
      expect(cursor.lastSyncs).toEqual({ files: 10 });
    });
  });
});
