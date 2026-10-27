import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PostgresSessionContext } from '../PostgresSessionContext.js';
import { Statements, type StatementPermission } from '../Statement.js';
import { TransactionExecutor } from '../TransactionExecutor.js';

const TENANT = 'tenant-a';
const SYSTEM = { bypass: true, refIds: [] };
const COLLABORATOR = { bypass: false, refIds: ['u1'] };

const CONTEXT_SQL = `SELECT current_setting('app.current_tenant', true) AS tenant,
  current_setting('uwazi.bypass_rls', true) AS bypass,
  current_setting('uwazi.ref_ids', true) AS "refIds"`;

const recorder = () => {
  const sent: string[] = [];
  const listener = (sql: string) => sent.push(sql.includes('set_config') ? 'context' : sql);
  return { sent, listener };
};

const newTransaction = (listener?: (sql: string) => void) =>
  new TransactionExecutor(PostgresDB.pipelinedPool(), new PostgresSessionContext(TENANT), listener);

const contextUnder = (permission: StatementPermission) =>
  Statements.raw(CONTEXT_SQL, [], permission);

const insert = (_id: string, permission: StatementPermission = SYSTEM) =>
  Statements.raw(
    'INSERT INTO thesauri ("_id", "name", "values", "tenant_id") VALUES (?, ?, ?, ?)',
    [_id, _id, '[]', TENANT],
    permission
  );

const select = (sql: string, bindings: unknown[] = []) => Statements.raw(sql, bindings, SYSTEM);

const thesaurusIds = async () =>
  (await testingPG.getAllFrom('thesauri')).map(row => row._id).sort();

describe('TransactionExecutor', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingPG.clear(['thesauri']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('messages', () => {
    it('should send nothing until the first statement, then BEGIN and the context with it', async () => {
      const { sent, listener } = recorder();
      const trx = newTransaction(listener);
      expect(sent).toEqual([]);

      await trx.query(select('SELECT 1 AS one'));
      await trx.commit();

      expect(sent).toEqual(['BEGIN', 'context', 'SELECT 1 AS one', 'COMMIT']);
    });

    it('should resend the context only when the permission changes', async () => {
      const { sent, listener } = recorder();
      const trx = newTransaction(listener);

      const seen = [
        await trx.query(contextUnder(SYSTEM)),
        await trx.query(contextUnder(SYSTEM)),
        await trx.query(contextUnder('inherit')),
        await trx.query(contextUnder(COLLABORATOR)),
        await trx.query(contextUnder('inherit')),
      ].map(result => result.rows[0]);
      await trx.commit();

      expect(seen.map(row => `${row.bypass}/${row.refIds}`)).toEqual([
        'true/',
        'true/',
        'true/',
        'false/u1',
        'false/u1',
      ]);
      expect(sent.filter(sql => sql === 'context')).toHaveLength(2);
    });

    it("should run a first 'inherit' statement under the default context", async () => {
      const trx = newTransaction();

      const { rows } = await trx.query(contextUnder('inherit'));
      await trx.commit();

      expect(rows[0]).toEqual({ tenant: TENANT, bypass: 'false', refIds: '' });
    });

    it('should take one connection for statements sent concurrently from the start', async () => {
      const trx = newTransaction();

      const [a, b] = await Promise.all([
        trx.query(select('SELECT txid_current() AS id')),
        trx.query(select('SELECT txid_current() AS id')),
      ]);
      await trx.commit();

      expect(a.rows[0].id).toBe(b.rows[0].id);
    });

    it('should send nothing on commit or rollback when no statement was sent', async () => {
      const { sent, listener } = recorder();

      await newTransaction(listener).commit();
      await newTransaction(listener).rollback();

      expect(sent).toEqual([]);
    });
  });

  describe('commit and rollback', () => {
    it('should make the writes visible once committed, and not before', async () => {
      const trx = newTransaction();

      await trx.queryAll([insert('c1'), insert('c2')]);
      expect(await thesaurusIds()).toEqual([]);
      await trx.commit();

      expect(await thesaurusIds()).toEqual(['c1', 'c2']);
    });

    it('should see its own uncommitted writes', async () => {
      const trx = newTransaction();

      await trx.query(insert('own'));
      const { rows } = await trx.query(select('SELECT "_id" FROM thesauri'));
      await trx.rollback();

      expect(rows).toEqual([{ _id: 'own' }]);
    });

    it('should discard the writes on rollback', async () => {
      const trx = newTransaction();

      await trx.query(insert('gone'));
      await trx.rollback();

      expect(await thesaurusIds()).toEqual([]);
    });

    it('should reject statements once closed', async () => {
      const committed = newTransaction();
      await committed.query(select('SELECT 1'));
      await committed.commit();
      const rolledBack = newTransaction();
      await rolledBack.rollback();

      await expect(committed.query(select('SELECT 1'))).rejects.toThrow('transaction is closed');
      await expect(rolledBack.query(select('SELECT 1'))).rejects.toThrow('transaction is closed');
    });
  });

  describe('failures', () => {
    it('should rethrow the first error from every later statement and from commit', async () => {
      const trx = newTransaction();
      await trx.query(insert('before'));

      const [failed, after] = await Promise.allSettled([
        trx.query(select('SELECT 1/0')),
        trx.query(insert('after')),
      ]);

      expect(failed).toMatchObject({ status: 'rejected', reason: { code: '22012' } });
      expect(after).toMatchObject({ status: 'rejected', reason: { code: '22012' } });
      await expect(trx.query(select('SELECT 1'))).rejects.toMatchObject({ code: '22012' });
      await expect(trx.commit()).rejects.toMatchObject({ code: '22012' });
      expect(await thesaurusIds()).toEqual([]);
    });

    it('should give the connection back to the pool after a failed transaction', async () => {
      const trx = newTransaction();
      await expect(trx.query(select('SELECT 1/0'))).rejects.toMatchObject({ code: '22012' });
      await expect(trx.commit()).rejects.toMatchObject({ code: '22012' });

      const next = newTransaction();
      const { rows } = await next.query(select('SELECT 2 AS v'));
      await next.commit();

      expect(rows).toEqual([{ v: 2 }]);
      expect(PostgresDB.pipelinedPool().waitingCount).toBe(0);
    });
  });

  describe('stream', () => {
    const series = (count: number) =>
      Statements.raw(`${CONTEXT_SQL}, n FROM generate_series(1, ?) AS n`, [count], COLLABORATOR);

    it('should stream rows inside the transaction, under the statement permission', async () => {
      const trx = newTransaction();
      await trx.query(insert('seen'));

      const rows: { n: number; refIds: string }[] = [];
      for await (const row of trx.stream<(typeof rows)[number]>(series(250))) rows.push(row);
      const { rows: inside } = await trx.query(select('SELECT "_id" FROM thesauri'));
      await trx.commit();

      expect(rows).toHaveLength(250);
      expect(new Set(rows.map(row => row.refIds))).toEqual(new Set(['u1']));
      expect(inside).toEqual([{ _id: 'seen' }]);
    });

    it('should reject a statement sent on the transaction while one of its streams is open', async () => {
      const trx = newTransaction();
      const failures: unknown[] = [];

      for await (const row of trx.stream<{ n: number }>(series(5))) {
        await trx.query(insert(`row-${row.n}`)).catch(error => failures.push(error));
      }
      await trx.commit();

      expect(failures).toHaveLength(5);
      expect((failures[0] as Error).message).toContain('while one of its streams is open');
      expect(await thesaurusIds()).toEqual([]);
    });
  });
});
