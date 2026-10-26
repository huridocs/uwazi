import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresTransactionManager } from '../PostgresTransactionManager.js';
import { Statements, type StatementPermission } from '../Statement.js';

const TENANT = 'tenant-a';
const SYSTEM = { bypass: true, refIds: [] };
const COLLABORATOR = { bypass: false, refIds: ['u1'] };

const CONTEXT_SQL = `SELECT current_setting('app.current_tenant', true) AS tenant,
  current_setting('uwazi.bypass_rls', true) AS bypass,
  current_setting('uwazi.ref_ids', true) AS "refIds"`;

const createManager = (tenantId = TENANT) =>
  new PostgresTransactionManager(PostgresDB.pipelinedPool(), tenantId, LoggerFactory.forTests());

const contextUnder = (permission: StatementPermission) =>
  Statements.raw(CONTEXT_SQL, [], permission);

const insert = (_id: string, permission: StatementPermission = SYSTEM) =>
  Statements.raw(
    'INSERT INTO thesauri ("_id", "name", "values", "tenant_id") VALUES (?, ?, ?, ?)',
    [_id, _id, '[]', TENANT],
    permission
  );

const select = (sql: string) => Statements.raw(sql, [], SYSTEM);

const thesaurusIds = async () =>
  (await testingPG.getAllFrom('thesauri')).map(row => row._id).sort();

/** The messages the executors send, with the context statement shown as 'context'. */
const recordStatements = () => {
  const statements: string[] = [];
  const stop = PostgresDB.onStatement(sql =>
    statements.push(sql.includes('set_config') ? 'context' : sql)
  );
  return { statements, stop };
};

/** A statement that fails with a serialization failure the first `times` times it is built. */
const failingWithSerialization = (times: number) => {
  let failures = 0;
  return () => {
    failures += 1;
    return failures <= times
      ? select("DO $$ BEGIN RAISE EXCEPTION 'conflict' USING ERRCODE = '40001'; END $$")
      : select('SELECT 1');
  };
};

describe('PostgresTransactionManager', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingPG.clear(['thesauri']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('outside a transaction', () => {
    it('should send BEGIN, the context, the statement and COMMIT for a read', async () => {
      const recorder = recordStatements();

      const result = await createManager().query(select('SELECT 1 AS one'));
      recorder.stop();

      expect(result.rows).toEqual([{ one: 1 }]);
      expect(recorder.statements).toEqual(['BEGIN', 'context', 'SELECT 1 AS one', 'COMMIT']);
    });

    it('should commit a write on its own, with the same four messages', async () => {
      const recorder = recordStatements();

      await createManager().query(insert('w1'));
      recorder.stop();

      expect(await thesaurusIds()).toEqual(['w1']);
      expect(recorder.statements).toEqual([
        'BEGIN',
        'context',
        expect.stringMatching(/^INSERT/),
        'COMMIT',
      ]);
    });

    it('should run a statement under the manager tenant and its own permission', async () => {
      const { rows } = await createManager('tenant-x').query(contextUnder(COLLABORATOR));

      expect(rows).toEqual([{ tenant: 'tenant-x', bypass: 'false', refIds: 'u1' }]);
    });

    it('should run queryAll in one transaction', async () => {
      await expect(
        createManager().queryAll([insert('q1'), select('SELECT 1/0')])
      ).rejects.toMatchObject({ code: '22012' });

      expect(await thesaurusIds()).toEqual([]);
    });

    it('should stream a statement', async () => {
      const rows: unknown[] = [];
      for await (const row of createManager().stream(
        select('SELECT n FROM generate_series(1, 3) AS n')
      )) {
        rows.push(row);
      }

      expect(rows).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
    });
  });

  describe('run', () => {
    it('should send BEGIN and the context with the first statement, and COMMIT at the end', async () => {
      const manager = createManager();
      const recorder = recordStatements();

      await manager.run(async () => {
        await manager.query(insert('r1'));
        await manager.query(insert('r2'));
      });
      recorder.stop();

      expect(recorder.statements).toEqual([
        'BEGIN',
        'context',
        expect.stringMatching(/^INSERT/),
        expect.stringMatching(/^INSERT/),
        'COMMIT',
      ]);
    });

    it('should send the context again only when the permission changes', async () => {
      const manager = createManager();
      const recorder = recordStatements();

      const seen = await manager.run(async () => [
        (await manager.query(contextUnder(SYSTEM))).rows[0],
        (await manager.query(contextUnder(SYSTEM))).rows[0],
        (await manager.query(contextUnder(COLLABORATOR))).rows[0],
        (await manager.query(contextUnder('inherit'))).rows[0],
      ]);
      recorder.stop();

      expect(seen.map(row => `${row.bypass}/${row.refIds}`)).toEqual([
        'true/',
        'true/',
        'false/u1',
        'false/u1',
      ]);
      expect(recorder.statements.filter(sql => sql === 'context')).toHaveLength(2);
    });

    it('should commit every write on success, and only then make them visible', async () => {
      const manager = createManager();

      await manager.run(async () => {
        await manager.query(insert('c1'));
        expect(await thesaurusIds()).toEqual([]);
        await manager.query(insert('c2'));
      });

      expect(await thesaurusIds()).toEqual(['c1', 'c2']);
    });

    it('should see its own uncommitted writes', async () => {
      const manager = createManager();

      const inside = await manager.run(async () => {
        await manager.query(insert('own'));
        return (await manager.query(select('SELECT "_id" FROM thesauri'))).rows;
      });

      expect(inside).toEqual([{ _id: 'own' }]);
    });

    it('should roll back every write when the callback throws', async () => {
      const manager = createManager();

      await expect(
        manager.run(async () => {
          await manager.query(insert('gone'));
          throw new Error('boom');
        })
      ).rejects.toThrow('boom');

      expect(await thesaurusIds()).toEqual([]);
    });

    it('should return the callback result', async () => {
      await expect(createManager().run(async () => 'result')).resolves.toBe('result');
    });

    it('should send nothing for a run without statements', async () => {
      const manager = createManager();
      const recorder = recordStatements();

      await manager.run(async () => undefined);
      recorder.stop();

      expect(recorder.statements).toEqual([]);
    });

    it('should reject when a transaction is already in progress', async () => {
      const manager = createManager();

      await expect(manager.run(async () => manager.run(async () => undefined))).rejects.toThrow(
        'Transaction already in progress.'
      );
    });

    it('should reject a statement sent while the run commits', async () => {
      const manager = createManager();
      let late: Promise<string> = Promise.resolve('');

      await manager.run(async () => {
        await manager.query(insert('kept'));
        late = new Promise(resolve => {
          setImmediate(resolve);
        })
          .then(async () => {
            await manager.query(insert('late'));
            return 'sent';
          })
          .catch((error: Error) => error.message);
      });

      expect(await late).toContain('transaction is closed');
      expect(await thesaurusIds()).toEqual(['kept']);
    });

    it('should leave the manager ready for the next run after a failed one', async () => {
      const manager = createManager();
      await expect(
        manager.run(async () => {
          await manager.query(select('SELECT 1/0'));
        })
      ).rejects.toMatchObject({ code: '22012' });

      await manager.run(async () => {
        await manager.query(insert('next'));
      });

      expect(await thesaurusIds()).toEqual(['next']);
    });
  });

  describe('retries', () => {
    it('should rerun the callback on a serialization failure, with a fresh transaction', async () => {
      const manager = createManager();
      const nextStatement = failingWithSerialization(2);
      let attempts = 0;

      await manager.run(async () => {
        attempts += 1;
        await manager.query(insert(`attempt-${attempts}`));
        await manager.query(nextStatement());
      });

      expect(attempts).toBe(3);
      expect(await thesaurusIds()).toEqual(['attempt-3']);
    });

    it('should run the onRetry handlers before each retry', async () => {
      const manager = createManager();
      const nextStatement = failingWithSerialization(1);
      const events: string[] = [];

      await manager.run(async () => {
        manager.onRetry(async () => {
          events.push('retry');
        });
        events.push('attempt');
        await manager.query(nextStatement());
      });

      expect(events).toEqual(['attempt', 'retry', 'attempt']);
    });

    it('should give up after three retries', async () => {
      const manager = createManager();
      const nextStatement = failingWithSerialization(10);
      let attempts = 0;

      await expect(
        manager.run(async () => {
          attempts += 1;
          await manager.query(nextStatement());
        })
      ).rejects.toMatchObject({ code: '40001' });

      expect(attempts).toBe(4);
    });
  });

  describe('commit handlers', () => {
    it('should fire onCommitted only after a successful commit', async () => {
      const manager = createManager();
      const seen: string[][] = [];

      await manager.run(async () => {
        manager.onCommitted(async () => {
          seen.push(await thesaurusIds());
        });
        await manager.query(insert('h1'));
      });

      expect(seen).toEqual([['h1']]);
    });

    it('should not fire onCommitted when the run rolls back', async () => {
      const manager = createManager();
      const handler = jest.fn().mockResolvedValue(undefined);

      await expect(
        manager.run(async () => {
          manager.onCommitted(handler);
          throw new Error('rolled back');
        })
      ).rejects.toThrow('rolled back');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should pass the run result to runHandlingOnCommitted handlers', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);

      const result = await createManager()
        .runHandlingOnCommitted(async () => 'value')
        .onCommitted(handler);

      expect(result).toBe('value');
      expect(handler).toHaveBeenCalledWith('value');
    });
  });

  describe('isRunning', () => {
    it('should be true inside run and false outside', async () => {
      const manager = createManager();

      const inside = await manager.run(async () => manager.isRunning());

      expect(inside).toBe(true);
      expect(manager.isRunning()).toBe(false);
    });
  });

  describe('getSession', () => {
    it('should have no Mongo session to give', () => {
      expect(createManager().getSession()).toBeUndefined();
    });
  });
});
