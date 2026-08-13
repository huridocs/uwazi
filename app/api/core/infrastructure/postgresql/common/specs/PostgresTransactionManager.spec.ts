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

describe('PostgresTransactionManager', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingPG.clear();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

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
    it('should propagate the original error when rollback also throws', async () => {
      const manager = createManager();
      const origBeginTx = manager.beginTransaction.bind(manager);

      jest.spyOn(manager, 'beginTransaction').mockImplementation(async pc => {
        const handle = await origBeginTx(pc);
        const origRollback = handle.rollback;
        handle.rollback = async () => {
          await origRollback();
          throw new Error('rollback failed');
        };
        return handle;
      });

      const originalError = new Error('original business error');
      await expect(
        manager.withConnection(async () => {
          throw originalError;
        })
      ).rejects.toThrow('original business error');
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

    it('should propagate the original error when rollback also throws', async () => {
      const manager = createManager();
      const origBeginTx = manager.beginTransaction.bind(manager);

      jest.spyOn(manager, 'beginTransaction').mockImplementation(async pc => {
        const handle = await origBeginTx(pc);
        const origRollback = handle.rollback;
        handle.rollback = async () => {
          await origRollback();
          throw new Error('rollback failed');
        };
        return handle;
      });

      const originalError = new Error('original run error');
      await expect(
        manager.run(async () => {
          throw originalError;
        })
      ).rejects.toThrow('original run error');
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

  describe('beginTransaction', () => {
    describe('top-level (no active transaction)', () => {
      it('should commit work when commit() is called', async () => {
        const manager = createManager();
        const handle = await manager.beginTransaction();
        await insertRow(handle.trx, 'bt1');
        await handle.commit();

        const rows = await testingPG.getAllFrom('thesauri');
        expect(rows.map(r => r._id)).toEqual(['bt1']);
      });

      it('should roll back work when rollback() is called', async () => {
        const manager = createManager();
        const handle = await manager.beginTransaction();
        await insertRow(handle.trx, 'bt-rollback');
        await handle.rollback();

        const rows = await testingPG.getAllFrom('thesauri');
        expect(rows).toHaveLength(0);
      });

      it('should set app.current_tenant for the manager tenant', async () => {
        const manager = createManager('tenant-bt');
        const handle = await manager.beginTransaction();
        const result = await handle.trx.raw(
          "SELECT current_setting('app.current_tenant', true) AS t"
        );
        await handle.commit();
        expect(result.rows[0].t).toBe('tenant-bt');
      });

      it('should set permission vars when provided', async () => {
        const manager = createManager();
        const handle = await manager.beginTransaction({
          bypass: true,
          refIds: ['ref1', 'ref2'],
        });

        const bypassResult = await handle.trx.raw(
          "SELECT current_setting('uwazi.bypass_rls', true) AS v"
        );
        const refIdsResult = await handle.trx.raw(
          "SELECT current_setting('uwazi.ref_ids', true) AS v"
        );

        await handle.commit();
        expect(bypassResult.rows[0].v).toBe('true');
        expect(refIdsResult.rows[0].v).toBe('ref1,ref2');
      });

      it('should set default permission vars when not provided', async () => {
        const manager = createManager();
        const handle = await manager.beginTransaction();

        const bypassResult = await handle.trx.raw(
          "SELECT current_setting('uwazi.bypass_rls', true) AS v"
        );
        const refIdsResult = await handle.trx.raw(
          "SELECT current_setting('uwazi.ref_ids', true) AS v"
        );

        await handle.commit();
        expect(bypassResult.rows[0].v).toBe('false');
        expect(refIdsResult.rows[0].v).toBe('');
      });
    });

    describe('nested inside run()', () => {
      it('should reuse the active transaction', async () => {
        const manager = createManager();

        await manager.run(async () => {
          const handle = await manager.beginTransaction();
          await insertRow(handle.trx, 'nested1');
          await handle.commit();
        });

        const rows = await testingPG.getAllFrom('thesauri');
        expect(rows.map(r => r._id)).toEqual(['nested1']);
      });

      it('should see uncommitted writes from the outer transaction', async () => {
        const manager = createManager();

        await manager.run(async () => {
          await manager.withConnection(async executor =>
            insertRow(executor, 'outer-write')
          );

          const handle = await manager.beginTransaction();
          const row = await handle.trx('thesauri')
            .where({ _id: 'outer-write' })
            .first();
          await handle.commit();

          expect(row).toMatchObject({ _id: 'outer-write' });
        });
      });

      it('commit() should be a no-op (outer transaction owns the lifecycle)', async () => {
        const manager = createManager();

        await manager.run(async () => {
          const handle = await manager.beginTransaction();
          await insertRow(handle.trx, 'nested-commit');
          await handle.commit();

          // Row still visible inside the run (uncommitted in the outer tx)
          const row = await manager.withConnection(async executor =>
            executor('thesauri').where({ _id: 'nested-commit' }).first()
          );
          expect(row).toMatchObject({ _id: 'nested-commit' });
        });

        const rows = await testingPG.getAllFrom('thesauri');
        expect(rows.map(r => r._id)).toEqual(['nested-commit']);
      });

      it('rollback() should be a no-op (outer transaction owns the lifecycle)', async () => {
        const manager = createManager();

        await manager.run(async () => {
          await manager.withConnection(async executor =>
            insertRow(executor, 'keep-me')
          );

          const handle = await manager.beginTransaction();
          await insertRow(handle.trx, 'nested-rollback');
          await handle.rollback();

          // 'keep-me' still visible — rollback was a no-op
          const row = await manager.withConnection(async executor =>
            executor('thesauri').where({ _id: 'keep-me' }).first()
          );
          expect(row).toMatchObject({ _id: 'keep-me' });
        });

        // Outer run commits everything — nested rollback didn't roll back
        const rows = await testingPG.getAllFrom('thesauri');
        expect(rows.map(r => r._id).sort()).toEqual(['keep-me', 'nested-rollback']);
      });
      it('should restore permission vars after nested beginTransaction completes', async () => {
        const manager = createManager();

        await manager.run(async () => {
          // Set initial permission context on the shared transaction
          const outerHandle = await manager.beginTransaction({
            bypass: true,
            refIds: ['admin'],
          });

          // Nested beginTransaction overwrites vars with different context
          const nestedHandle = await manager.beginTransaction({
            bypass: false,
            refIds: ['user1'],
          });
          await nestedHandle.commit(); // no-op on shared tx

          const result = await outerHandle.trx.raw(
            "SELECT current_setting('uwazi.bypass_rls', true) AS bypass, current_setting('uwazi.ref_ids', true) AS ref_ids"
          );

          expect(result.rows[0].bypass).toBe('true');
          expect(result.rows[0].ref_ids).toBe('admin');

          await outerHandle.commit(); // no-op
        });
      });
    });
  });
});
