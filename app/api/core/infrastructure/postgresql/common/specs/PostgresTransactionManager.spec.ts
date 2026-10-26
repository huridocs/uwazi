import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresTransactionManager } from '../PostgresTransactionManager.js';
import { Statements } from '../Statement.js';

const TENANT = 'tenant-a';

const createManager = (tenantId = TENANT) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const insertRow = (executor: any, _id: string, name = _id, tenantId = TENANT) =>
  executor('thesauri').insert({ _id, name, values: JSON.stringify([]), tenant_id: tenantId });

const deferred = <T = void>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolveFn => {
    resolve = resolveFn;
  });
  return { promise, resolve };
};

/** Records every statement knex sends, transaction control included. */
const recordStatements = () => {
  const statements: string[] = [];
  const listener = (query: { sql: string }) => statements.push(query.sql);
  PostgresDB.knex.on('query', listener);
  return {
    statements,
    stop: () => PostgresDB.knex.removeListener('query', listener),
  };
};

const spyOnCommit = (manager: PostgresTransactionManager): string[] => {
  const events: string[] = [];
  const originalBegin = manager.beginTransaction.bind(manager);
  jest.spyOn(manager, 'beginTransaction').mockImplementation(async permissionContext => {
    const handle = await originalBegin(permissionContext);
    const { commit } = handle;
    handle.commit = async () => {
      events.push('commit');
      await commit();
    };
    return handle;
  });
  return events;
};

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

    it('should wait for a joined connection still in flight before committing', async () => {
      const manager = createManager();
      const events = spyOnCommit(manager);
      const joinGate = deferred();

      let slow!: Promise<unknown>;
      const runPromise = manager.run(async () => {
        slow = manager.withConnection(async executor => {
          await joinGate.promise;
          events.push('joined-write');
          await insertRow(executor, 'joined-late');
        });
      });

      joinGate.resolve();
      await slow;
      await runPromise;

      expect(events).toEqual(['joined-write', 'commit']);
      expect((await testingPG.getAllFrom('thesauri')).map(r => r._id)).toEqual(['joined-late']);
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

  describe('statements sent to set the context', () => {
    const contextStatements = (statements: string[]) =>
      statements.filter(sql => sql.includes('set_config') || sql.includes('current_setting'));

    it('should send BEGIN and the context in one message when opening a transaction', async () => {
      const manager = createManager();
      const recorder = recordStatements();

      await manager.withConnection(async () => undefined, { bypass: true, refIds: ['r1'] });
      recorder.stop();

      expect(recorder.statements).toEqual([
        expect.stringMatching(/^BEGIN;\s*SELECT set_config\('app.current_tenant'/),
        'COMMIT;',
      ]);
    });

    it('should keep tenant and ref ids with quotes, backslashes, semicolons and question marks as plain values', async () => {
      const tenant = "o'brien?\\'; DROP TABLE thesauri; --";
      const manager = createManager(tenant);

      const seen = await manager.withConnection(
        async executor =>
          (
            await executor.raw(
              "SELECT current_setting('app.current_tenant', true) AS tenant, current_setting('uwazi.ref_ids', true) AS ref_ids"
            )
          ).rows[0],
        { bypass: false, refIds: ["r'1?", 'r\\2;'] }
      );

      expect(seen).toEqual({ tenant, ref_ids: "r'1?,r\\2;" });
      await expect(
        createManager().withConnection(async executor => executor('thesauri').select())
      ).resolves.toEqual([]);
    });

    it('should set the context with a single statement when joining a run', async () => {
      const manager = createManager();

      await manager.run(async () => {
        const recorder = recordStatements();
        await manager.withConnection(async () => undefined, { bypass: false, refIds: ['r1'] });
        recorder.stop();

        expect(contextStatements(recorder.statements)).toHaveLength(1);
      });
    });

    it('should not read the context back from the database for a nested beginTransaction', async () => {
      const manager = createManager();

      await manager.run(async () => {
        await manager.withConnection(async () => undefined, { bypass: true, refIds: ['admin'] });

        const recorder = recordStatements();
        const nested = await manager.beginTransaction({ bypass: false, refIds: ['user1'] });
        await nested.commit();
        recorder.stop();

        expect(recorder.statements.filter(sql => sql.includes('current_setting'))).toHaveLength(0);
        expect(contextStatements(recorder.statements)).toHaveLength(2);
      });
    });

    it('should send no context statement when a joined connection keeps the same context', async () => {
      const manager = createManager();

      await manager.run(async () => {
        await manager.withConnection(async () => undefined, { bypass: true, refIds: ['r1'] });

        const recorder = recordStatements();
        await manager.withConnection(async () => undefined, { bypass: true, refIds: ['r1'] });
        recorder.stop();

        expect(contextStatements(recorder.statements)).toHaveLength(0);
      });
    });

    it('should apply the new context when a joined connection changes it', async () => {
      const manager = createManager();

      const seen = await manager.run(async () => {
        await manager.withConnection(async () => undefined, { bypass: true, refIds: ['r1'] });
        return manager.withConnection(
          async executor =>
            (
              await executor.raw(
                "SELECT current_setting('app.current_tenant', true) AS tenant, current_setting('uwazi.bypass_rls', true) AS bypass, current_setting('uwazi.ref_ids', true) AS ref_ids"
              )
            ).rows[0],
          { bypass: false, refIds: ['r2', 'r3'] }
        );
      });

      expect(seen).toEqual({ tenant: TENANT, bypass: 'false', ref_ids: 'r2,r3' });
    });
  });

  describe('concurrent joins on the active transaction', () => {
    const readContext = async (executor: any) =>
      (
        await executor.raw(
          "SELECT current_setting('uwazi.bypass_rls', true) AS bypass, current_setting('uwazi.ref_ids', true) AS ref_ids"
        )
      ).rows[0];

    it('should run each joined connection with its own permission context', async () => {
      const manager = createManager();
      const firstStarted = deferred();
      const releaseFirst = deferred();

      const [first, second] = await manager.run(async () =>
        Promise.all([
          manager.withConnection(
            async executor => {
              firstStarted.resolve();
              await releaseFirst.promise;
              return readContext(executor);
            },
            { bypass: true, refIds: ['admin'] }
          ),
          (async () => {
            await firstStarted.promise;
            const pending = manager.withConnection(readContext, {
              bypass: false,
              refIds: ['user1'],
            });
            releaseFirst.resolve();
            return pending;
          })(),
        ])
      );

      expect(first).toEqual({ bypass: 'true', ref_ids: 'admin' });
      expect(second).toEqual({ bypass: 'false', ref_ids: 'user1' });
    });

    it('should not deadlock a connection joined from inside another, and restore the outer context', async () => {
      const manager = createManager();

      const seen = await manager.run(async () =>
        manager.withConnection(
          async executor => {
            const inner = await manager.withConnection(readContext, {
              bypass: false,
              refIds: ['inner'],
            });
            return { inner, outer: await readContext(executor) };
          },
          { bypass: true, refIds: ['outer'] }
        )
      );

      expect(seen).toEqual({
        inner: { bypass: 'false', ref_ids: 'inner' },
        outer: { bypass: 'true', ref_ids: 'outer' },
      });
    });
  });

  describe('runReadOnly', () => {
    it('should run every connection inside it in a single read only transaction', async () => {
      const manager = createManager();
      const recorder = recordStatements();

      await manager.runReadOnly(async () => {
        await manager.withConnection(async executor => executor('thesauri').select());
        await manager.withConnection(async executor => executor('thesauri').select());
      });
      recorder.stop();

      expect(recorder.statements.filter(sql => sql.startsWith('BEGIN'))).toEqual([
        expect.stringMatching(/^BEGIN TRANSACTION READ ONLY;\s*SELECT set_config\(/),
      ]);
      expect(recorder.statements.filter(sql => sql.startsWith('COMMIT'))).toHaveLength(1);
    });

    it('should reject writes', async () => {
      const manager = createManager();

      await expect(
        manager.runReadOnly(async () =>
          manager.withConnection(async executor => insertRow(executor, 'ro'))
        )
      ).rejects.toMatchObject({ code: '25006' });

      expect(await testingPG.getAllFrom('thesauri')).toHaveLength(0);
    });

    it('should return the callback result and leave the manager ready for the next transaction', async () => {
      const manager = createManager();

      const result = await manager.runReadOnly(async () => 'value');
      await manager.run(async () => manager.withConnection(async ex => insertRow(ex, 'after')));

      expect(result).toBe('value');
      expect((await testingPG.getAllFrom('thesauri')).map(r => r._id)).toEqual(['after']);
    });

    it('should roll back and rethrow when the callback fails', async () => {
      const manager = createManager();

      await expect(
        manager.runReadOnly(async () => {
          throw new Error('read failed');
        })
      ).rejects.toThrow('read failed');

      await manager.run(async () => manager.withConnection(async ex => insertRow(ex, 'after')));
      expect((await testingPG.getAllFrom('thesauri')).map(r => r._id)).toEqual(['after']);
    });

    it('should join a running transaction instead of opening its own', async () => {
      const manager = createManager();

      await manager.run(async () =>
        manager.runReadOnly(async () =>
          manager.withConnection(async executor => insertRow(executor, 'inside-run'))
        )
      );

      expect((await testingPG.getAllFrom('thesauri')).map(r => r._id)).toEqual(['inside-run']);
    });

    it('should not report a running transaction, so write-only guards and commit hooks are unaffected', async () => {
      const manager = createManager();

      const running = await manager.runReadOnly(async () => manager.isRunning());

      expect(running).toBe(false);
    });
  });

  describe('readWithoutBindings', () => {
    it('should read under the manager tenant in a single statement outside a transaction', async () => {
      await createManager('tenant-a').withConnection(async executor =>
        insertRow(executor, 'a1', 'a1', 'tenant-a')
      );
      await createManager('tenant-b').withConnection(async executor =>
        insertRow(executor, 'b1', 'b1', 'tenant-b')
      );
      const recorder = recordStatements();

      const rows = await createManager('tenant-a').readWithoutBindings<{ _id: string }>(
        'SELECT "_id" FROM thesauri;'
      );
      recorder.stop();

      expect(rows).toEqual([{ _id: 'a1' }]);
      expect(recorder.statements).toHaveLength(1);
    });

    it('should join a running transaction and see its uncommitted writes', async () => {
      const manager = createManager();

      const rows = await manager.run(async () => {
        await manager.withConnection(async executor => insertRow(executor, 'pending'));
        return manager.readWithoutBindings<{ _id: string }>('SELECT "_id" FROM thesauri;');
      });

      expect(rows).toEqual([{ _id: 'pending' }]);
    });

    it('should reject a failing read and leave the connection usable', async () => {
      const manager = createManager();

      await expect(manager.readWithoutBindings('SELECT * FROM missing_table;')).rejects.toThrow(
        'missing_table'
      );
      await expect(manager.readWithoutBindings('SELECT 1 AS one;')).resolves.toEqual([{ one: 1 }]);
    });
  });

  describe('statements', () => {
    const CONTEXT_SQL = `SELECT current_setting('app.current_tenant', true) AS tenant,
      current_setting('uwazi.bypass_rls', true) AS bypass,
      current_setting('uwazi.ref_ids', true) AS "refIds"`;

    const contextStatement = (permission: Parameters<typeof Statements.raw>[2]) =>
      Statements.raw(CONTEXT_SQL, [], permission);

    it('should run a statement under its own permission and return rows and rowCount', async () => {
      const manager = createManager('tenant-x');

      const result = await manager.query(contextStatement({ bypass: false, refIds: ['u1', 'g1'] }));

      expect(result.rowCount).toBe(1);
      expect(result.rows).toEqual([{ tenant: 'tenant-x', bypass: 'false', refIds: 'u1,g1' }]);
    });

    it('should run a statement built from a query builder, bindings included', async () => {
      const manager = createManager();
      await manager.withConnection(async executor => insertRow(executor, 'b1', 'wanted'));
      await manager.withConnection(async executor => insertRow(executor, 'b2', 'other'));

      const result = await manager.query(
        Statements.fromBuilder(
          Statements.builder('thesauri').select('_id').where({ name: 'wanted' }),
          {
            bypass: true,
            refIds: [],
          }
        )
      );

      expect(result.rows).toEqual([{ _id: 'b1' }]);
    });

    it("should keep the running transaction's permission for an 'inherit' statement", async () => {
      const manager = createManager();

      const inherited = await manager.run(async () => {
        await manager.query(contextStatement({ bypass: true, refIds: [] }));
        return manager.query(contextStatement('inherit'));
      });

      expect(inherited.rows[0]).toMatchObject({ bypass: 'true', refIds: '' });
    });

    it('should run every statement of queryAll in one transaction, in order', async () => {
      const manager = createManager();
      const insert = (_id: string) =>
        Statements.raw(
          'INSERT INTO thesauri ("_id", "name", "values", "tenant_id") VALUES (?, ?, ?, ?)',
          [_id, _id, '[]', TENANT],
          { bypass: true, refIds: [] }
        );

      const results = await manager.queryAll([insert('q1'), insert('q2')]);

      expect(results.map(r => r.rowCount)).toEqual([1, 1]);
      expect((await testingPG.getAllFrom('thesauri')).map(r => r._id).sort()).toEqual(['q1', 'q2']);
    });

    it('should roll back every statement of queryAll when one fails', async () => {
      const manager = createManager();
      const insert = Statements.raw(
        'INSERT INTO thesauri ("_id", "name", "values", "tenant_id") VALUES (?, ?, ?, ?)',
        ['r1', 'r1', '[]', TENANT],
        { bypass: true, refIds: [] }
      );
      const failing = Statements.raw('SELECT 1/0', [], { bypass: true, refIds: [] });

      await expect(manager.queryAll([insert, failing])).rejects.toThrow('division by zero');

      expect(await testingPG.getAllFrom('thesauri')).toEqual([]);
    });

    it('should stream the rows of a statement under its permission', async () => {
      const manager = createManager('tenant-s');

      const rows: unknown[] = [];
      for await (const row of manager.stream(
        Statements.raw(`${CONTEXT_SQL}, n FROM generate_series(1, 3) AS n`, [], {
          bypass: false,
          refIds: ['u1'],
        })
      )) {
        rows.push(row);
      }

      expect(rows).toEqual(
        [1, 2, 3].map(n => ({ tenant: 'tenant-s', bypass: 'false', refIds: 'u1', n }))
      );
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

      it('should reject when the transaction cannot be opened with its context', async () => {
        const knex = {
          transaction: jest.fn().mockRejectedValue(new Error('set_config failed')),
        };
        const manager = new PostgresTransactionManager(
          knex as any,
          'tenant-leak',
          LoggerFactory.forTests()
        );

        await expect(manager.beginTransaction()).rejects.toThrow('set_config failed');
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
          await manager.withConnection(async executor => insertRow(executor, 'outer-write'));

          const handle = await manager.beginTransaction();
          const row = await handle.trx('thesauri').where({ _id: 'outer-write' }).first();
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
          await manager.withConnection(async executor => insertRow(executor, 'keep-me'));

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
