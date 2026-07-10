import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresTransactionManager } from '../PostgresTransactionManager.js';

const TENANT = 'tenant-a';

const createManager = (tenantId = TENANT) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const insertRow = (executor: any, _id: string, name = _id, tenantId = TENANT) =>
  executor('thesauri').insert({ _id, name, values: JSON.stringify([]), tenant_id: tenantId });

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingPG.clear(['thesauri']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresTransactionManager', () => {
  describe('withConnection (case #1 — no active transaction)', () => {
    it('should open a transaction and set app.current_tenant for the manager tenant', async () => {
      const manager = createManager('tenant-x');

      const setting = await manager.withConnection(async executor => {
        const result = await executor.raw(
          "SELECT current_setting('app.current_tenant', true) AS t"
        );
        return result.rows[0].t;
      });

      expect(setting).toBe('tenant-x');
    });

    it('should commit the work performed inside the connection', async () => {
      const manager = createManager();

      await manager.withConnection(async executor => insertRow(executor, 'c1'));

      const rows = await testingPG.getAllFrom('thesauri');
      expect(rows.map(r => r._id)).toEqual(['c1']);
    });
  });

  describe('withConnection (case #2 — active transaction from run)', () => {
    it('should reuse the running transaction so uncommitted writes are visible to later reads', async () => {
      const manager = createManager();

      const seenInsideRun = await manager.run(async () => {
        await manager.withConnection(async executor => insertRow(executor, 'shared'));
        return manager.withConnection(async executor =>
          executor('thesauri').where({ _id: 'shared' }).first()
        );
      });

      expect(seenInsideRun).toMatchObject({ _id: 'shared' });
    });

    it('should roll back the shared transaction when the run throws', async () => {
      const manager = createManager();

      await expect(
        manager.run(async () => {
          await manager.withConnection(async executor => insertRow(executor, 'rollback-me'));
          throw new Error('boom');
        })
      ).rejects.toThrow('boom');

      const rows = await testingPG.getAllFrom('thesauri');
      expect(rows).toHaveLength(0);
    });
  });

  describe('run', () => {
    it('should commit all writes on success', async () => {
      const manager = createManager();

      await manager.run(async () => {
        await manager.withConnection(async executor => insertRow(executor, 'r1'));
        await manager.withConnection(async executor => insertRow(executor, 'r2'));
      });

      const rows = await testingPG.getAllFrom('thesauri');
      expect(rows.map(r => r._id).sort()).toEqual(['r1', 'r2']);
    });

    it('should roll back all writes on error', async () => {
      const manager = createManager();

      await expect(
        manager.run(async () => {
          await manager.withConnection(async executor => insertRow(executor, 'r1'));
          throw new Error('fail');
        })
      ).rejects.toThrow('fail');

      const rows = await testingPG.getAllFrom('thesauri');
      expect(rows).toHaveLength(0);
    });

    it('should fire onCommitted only after a successful commit', async () => {
      const manager = createManager();
      const handler = jest.fn().mockResolvedValue(undefined);
      manager.onCommitted(handler);

      await manager.run(async () =>
        manager.withConnection(async executor => insertRow(executor, 'oc-1'))
      );

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should NOT fire onCommitted when the run rolls back', async () => {
      const manager = createManager();
      const handler = jest.fn().mockResolvedValue(undefined);
      manager.onCommitted(handler);

      await expect(
        manager.run(async () => {
          throw new Error('nope');
        })
      ).rejects.toThrow('nope');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject when a transaction is already in progress', async () => {
      const manager = createManager();

      await manager.run(async () => {
        await expect(manager.run(async () => undefined)).rejects.toThrow(
          'Transaction already in progress.'
        );
      });
    });
  });

  describe('isRunning', () => {
    it('should be true inside run and false outside', async () => {
      const manager = createManager();

      expect(manager.isRunning()).toBe(false);

      await manager.run(async () => {
        expect(manager.isRunning()).toBe(true);
      });

      expect(manager.isRunning()).toBe(false);
    });
  });
});
