import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { AutoCommitExecutor } from '../AutoCommitExecutor.js';
import { PostgresSessionContext } from '../PostgresSessionContext.js';
import { Statements, type StatementPermission } from '../Statement.js';

const SYSTEM = { bypass: true, refIds: [] };

const CONTEXT_SQL = `SELECT current_setting('app.current_tenant', true) AS tenant,
  current_setting('uwazi.bypass_rls', true) AS bypass,
  current_setting('uwazi.ref_ids', true) AS "refIds"`;

/** The messages an executor sends, with the context statement shown as 'context'. */
const recorder = () => {
  const sent: string[] = [];
  const listener = (sql: string) => sent.push(sql.includes('set_config') ? 'context' : sql);
  return { sent, listener };
};

const executorFor = (tenantId: string, listener?: (sql: string) => void) =>
  new AutoCommitExecutor(
    PostgresDB.pipelinedPool(),
    new PostgresSessionContext(tenantId),
    listener
  );

const contextUnder = (permission: StatementPermission) =>
  Statements.raw(CONTEXT_SQL, [], permission);

const insertThesaurus = async (_id: string, tenantId: string) =>
  testingPG.pool!.query(
    'INSERT INTO thesauri ("_id", "name", "values", "tenant_id") VALUES ($1, $1, \'[]\', $2)',
    [_id, tenantId]
  );

const thesaurusIds = async () =>
  (await testingPG.getAllFrom('thesauri')).map(row => row._id).sort();

describe('AutoCommitExecutor', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingPG.clear(['thesauri']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('query', () => {
    it('should send BEGIN, the context, the statement and COMMIT, and return its rows', async () => {
      const { sent, listener } = recorder();

      const result = await executorFor('tenant-a', listener).query(
        Statements.raw('SELECT ?::int AS n', [42], SYSTEM)
      );

      expect(result).toEqual({ rows: [{ n: 42 }], rowCount: 1 });
      expect(sent).toEqual(['BEGIN', 'context', 'SELECT $1::int AS n', 'COMMIT']);
    });

    it('should run the statement under its tenant and permission', async () => {
      const result = await executorFor('tenant-a').query(
        contextUnder({ bypass: false, refIds: ['u1', 'g1'] })
      );

      expect(result.rows).toEqual([{ tenant: 'tenant-a', bypass: 'false', refIds: 'u1,g1' }]);
    });

    it("should run an 'inherit' statement under the default context", async () => {
      const result = await executorFor('tenant-a').query(contextUnder('inherit'));

      expect(result.rows).toEqual([{ tenant: 'tenant-a', bypass: 'false', refIds: '' }]);
    });

    it("should only see the tenant's rows", async () => {
      await insertThesaurus('a1', 'tenant-a');
      await insertThesaurus('b1', 'tenant-b');

      const result = await executorFor('tenant-a').query(
        Statements.fromBuilder(Statements.builder('thesauri').select('_id'), SYSTEM)
      );

      expect(result.rows).toEqual([{ _id: 'a1' }]);
    });

    it('should keep the values with quotes, backslashes and question marks as plain values', async () => {
      const tenant = "it's\\a;?tenant";

      const result = await executorFor(tenant).query(
        contextUnder({ bypass: false, refIds: ["o'k", 'a\\b', '?;'] })
      );

      expect(result.rows[0]).toEqual({ tenant, bypass: 'false', refIds: "o'k,a\\b,?;" });
    });

    it('should reject with the error Postgres reports, SQLSTATE included', async () => {
      await expect(
        executorFor('tenant-a').query(Statements.raw('SELECT 1/0', [], SYSTEM))
      ).rejects.toMatchObject({ code: '22012' });
    });

    it('should leave the connection usable after a server side timeout', async () => {
      const executor = executorFor('tenant-a');

      await expect(
        executor.queryAll([
          Statements.raw("SET LOCAL statement_timeout = '50ms'", [], SYSTEM),
          Statements.raw('SELECT pg_sleep(1)', [], SYSTEM),
        ])
      ).rejects.toMatchObject({ code: '57014' });

      await expect(
        executor.query(Statements.raw('SELECT 3 AS v', [], SYSTEM))
      ).resolves.toMatchObject({ rows: [{ v: 3 }] });
    });

    it('should never leave a tenant behind on a pooled connection', async () => {
      await Promise.all(
        Array.from({ length: 200 }, async (_, i) => {
          const tenant = `t${i % 7}`;
          const { rows } = await executorFor(tenant).query(
            contextUnder({ bypass: false, refIds: [`ref${i}`] })
          );
          expect(rows[0]).toEqual({ tenant, bypass: 'false', refIds: `ref${i}` });
        })
      );

      const leftovers = await Promise.all(
        Array.from({ length: 10 }, async () =>
          PostgresDB.pipelinedPool().query(
            "SELECT current_setting('app.current_tenant', true) AS tenant"
          )
        )
      );
      expect(leftovers.map(({ rows }) => rows[0].tenant ?? '')).toEqual(Array(10).fill(''));
    });
  });

  describe('queryAll', () => {
    const insert = (_id: string) =>
      Statements.raw(
        'INSERT INTO thesauri ("_id", "name", "values", "tenant_id") VALUES (?, ?, ?, ?)',
        [_id, _id, '[]', 'tenant-a'],
        SYSTEM
      );

    it('should send every statement in one transaction, the context only when it changes', async () => {
      const { sent, listener } = recorder();

      const results = await executorFor('tenant-a', listener).queryAll([
        contextUnder(SYSTEM),
        contextUnder(SYSTEM),
        contextUnder('inherit'),
        contextUnder({ bypass: false, refIds: ['u1'] }),
      ]);

      expect(results.map(r => r.rows[0])).toEqual([
        { tenant: 'tenant-a', bypass: 'true', refIds: '' },
        { tenant: 'tenant-a', bypass: 'true', refIds: '' },
        { tenant: 'tenant-a', bypass: 'true', refIds: '' },
        { tenant: 'tenant-a', bypass: 'false', refIds: 'u1' },
      ]);
      expect(sent.filter(sql => ['BEGIN', 'context', 'COMMIT'].includes(sql))).toEqual([
        'BEGIN',
        'context',
        'context',
        'COMMIT',
      ]);
    });

    it('should roll back every statement and reject with the first error when one fails', async () => {
      const failure = executorFor('tenant-a').queryAll([
        insert('r1'),
        Statements.raw('SELECT 1/0', [], SYSTEM),
        insert('r2'),
      ]);

      await expect(failure).rejects.toMatchObject({ code: '22012' });
      expect(await thesaurusIds()).toEqual([]);
    });

    it('should commit every statement when all succeed', async () => {
      await executorFor('tenant-a').queryAll([insert('c1'), insert('c2')]);

      expect(await thesaurusIds()).toEqual(['c1', 'c2']);
    });

    it('should send nothing for no statements', async () => {
      const { sent, listener } = recorder();

      expect(await executorFor('tenant-a', listener).queryAll([])).toEqual([]);
      expect(sent).toEqual([]);
    });
  });

  describe('stream', () => {
    const series = (count: number) =>
      Statements.raw(`${CONTEXT_SQL}, n FROM generate_series(1, ?) AS n`, [count], {
        bypass: false,
        refIds: ['u1'],
      });

    it('should stream every row, under its tenant and permission, in batches', async () => {
      const rows: { n: number; tenant: string; refIds: string }[] = [];
      for await (const row of executorFor('tenant-s').stream<(typeof rows)[number]>(series(250))) {
        rows.push(row);
      }

      expect(rows.map(row => row.n)).toEqual(Array.from({ length: 250 }, (_, i) => i + 1));
      expect(new Set(rows.map(row => `${row.tenant}/${row.refIds}`))).toEqual(
        new Set(['tenant-s/u1'])
      );
    });

    it('should release the connection when the loop breaks early', async () => {
      const executor = executorFor('tenant-s');
      const seen: number[] = [];

      for await (const row of executor.stream<{ n: number }>(series(500))) {
        seen.push(row.n);
        if (seen.length === 3) break;
      }

      expect(seen).toEqual([1, 2, 3]);
      await expect(
        executor.query(Statements.raw('SELECT 1 AS v', [], SYSTEM))
      ).resolves.toMatchObject({ rows: [{ v: 1 }] });
    });

    it('should reject with the error that broke the stream', async () => {
      const consume = async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _row of executorFor('tenant-s').stream(
          Statements.raw('SELECT * FROM missing_table', [], SYSTEM)
        )) {
          // never reached
        }
      };

      await expect(consume()).rejects.toMatchObject({ code: '42P01' });
    });
  });
});
