import { Client } from 'pg';
import { config } from '#api/config.js';
import uniqueID from '#shared/uniqueID.js';
import { ScratchDatabaseFactory } from '#api/core/infrastructure/factories/ScratchDatabaseFactory.js';
import type { ScratchDatabase } from '../ScratchDatabase.js';

async function databasesStartingWith(prefix: string): Promise<string[]> {
  const client = new Client({
    host: config.postgres.host,
    port: config.postgres.port,
    database: 'postgres',
    user: config.postgres.admin.user,
    password: config.postgres.admin.password,
  });
  await client.connect();
  try {
    const result = await client.query<{ datname: string }>(
      'SELECT datname FROM pg_database WHERE datname LIKE $1',
      [`${prefix}%`]
    );
    return result.rows.map(row => row.datname);
  } finally {
    await client.end();
  }
}

describe('ScratchDatabase', () => {
  let prefix: string;
  let scratch: ScratchDatabase | undefined;

  beforeEach(() => {
    prefix = `uwazi_scratch_spec_${uniqueID()}`.toLowerCase();
  });

  afterEach(async () => {
    await scratch?.drop();
    scratch = undefined;
  });

  it('creates a database named after the prefix', async () => {
    scratch = await ScratchDatabaseFactory.create({ prefix });

    expect(scratch.name.startsWith(`${prefix}_`)).toBe(true);
    expect(scratch.name.length).toBeLessThanOrEqual(63);
    expect(await databasesStartingWith(prefix)).toEqual([scratch.name]);
  });

  it('is provisioned so the migrator owns tables and the app role can use them', async () => {
    scratch = await ScratchDatabaseFactory.create({ prefix });
    const { pool, appKnex } = scratch.connections();

    await pool.query('CREATE TABLE scratch_check (id INTEGER PRIMARY KEY, label TEXT)');
    await appKnex('scratch_check').insert({ id: 1, label: 'from app' });

    expect(await appKnex('scratch_check').select('id', 'label')).toEqual([
      { id: 1, label: 'from app' },
    ]);
    const owner = await pool.query<{ tableowner: string }>(
      "SELECT tableowner FROM pg_tables WHERE tablename = 'scratch_check'"
    );
    expect(owner.rows).toEqual([{ tableowner: config.postgres.migrator.user }]);
  });

  it('drops the database, and dropping again is a no-op', async () => {
    scratch = await ScratchDatabaseFactory.create({ prefix });
    await scratch.connections().pool.query('SELECT 1');

    await scratch.drop();
    await scratch.drop();

    expect(await databasesStartingWith(prefix)).toEqual([]);
  });

  it('drops the database when provisioning fails', async () => {
    await expect(
      ScratchDatabaseFactory.create({ prefix, provisioningSql: ['SELECT * FROM missing_table'] })
    ).rejects.toThrow('missing_table');

    expect(await databasesStartingWith(prefix)).toEqual([]);
  });
});
