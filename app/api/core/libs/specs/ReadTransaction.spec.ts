import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { ExecutionContext } from '../ExecutionContext.js';
import { ReadTransaction } from '../ReadTransaction.js';

class Reader {
  constructor(private prefix: string) {}

  @ReadTransaction()
  async read(suffix: string) {
    const pg = ExecutionContext.postgresTransactionManager;
    await pg.withConnection(async executor => executor('thesauri').select());
    await pg.withConnection(async executor => executor('thesauri').select());
    return `${this.prefix}-${suffix}`;
  }
}

const recordStatements = () => {
  const statements: string[] = [];
  const listener = (query: { sql: string }) => statements.push(query.sql);
  PostgresDB.knex.on('query', listener);
  return { statements, stop: () => PostgresDB.knex.removeListener('query', listener) };
};

const transactionsOpened = (statements: string[]) =>
  statements.filter(sql => sql.startsWith('BEGIN'));

describe('@ReadTransaction()', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should run the method in one read only transaction when the tenant is on Postgres', async () => {
    testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: true } });
    const recorder = recordStatements();

    const result = await testingEnvironment.runWithContext(async () =>
      new Reader('reader').read('done')
    );
    recorder.stop();

    expect(result).toBe('reader-done');
    expect(transactionsOpened(recorder.statements)).toEqual(['BEGIN TRANSACTION READ ONLY;']);
  });

  it('should leave each read in its own transaction when the tenant is on Mongo', async () => {
    testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: false } });
    const recorder = recordStatements();

    const result = await testingEnvironment.runWithContext(async () =>
      new Reader('reader').read('done')
    );
    recorder.stop();

    expect(result).toBe('reader-done');
    expect(transactionsOpened(recorder.statements)).toEqual(['BEGIN;', 'BEGIN;']);
  });
});
