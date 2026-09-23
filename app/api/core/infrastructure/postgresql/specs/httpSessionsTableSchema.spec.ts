import { Client } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';

const pool = () => {
  const { pool: adminPool } = testingEnvironment.pg;
  if (!adminPool) throw new Error('PG pool not available');
  return adminPool;
};

describe('022-create-http-sessions-table', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await pool().query('DELETE FROM http_sessions');
  });

  it('should store a session id, its json, and an expiry, and nothing else', async () => {
    const { rows } = await pool().query(
      `SELECT column_name, udt_name, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'http_sessions'
       ORDER BY column_name`
    );

    expect(rows).toEqual([
      { column_name: 'expire', udt_name: 'timestamp', is_nullable: 'NO' },
      { column_name: 'sess', udt_name: 'jsonb', is_nullable: 'NO' },
      { column_name: 'sid', udt_name: 'varchar', is_nullable: 'NO' },
    ]);
  });

  it('should key sessions by sid and index expiry for pruning', async () => {
    const { rows } = await pool().query(
      "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'http_sessions' ORDER BY indexname"
    );

    expect(rows).toEqual([
      {
        indexname: 'http_sessions_expire',
        indexdef: expect.stringContaining('(expire)'),
      },
      { indexname: 'http_sessions_pkey', indexdef: expect.stringContaining('(sid)') },
    ]);
  });

  it('should not enable row level security', async () => {
    const { rows: security } = await pool().query(
      "SELECT relrowsecurity FROM pg_class WHERE relname = 'http_sessions'"
    );
    const { rows: policies } = await pool().query(
      "SELECT policyname FROM pg_policies WHERE tablename = 'http_sessions'"
    );

    expect(security).toEqual([{ relrowsecurity: false }]);
    expect(policies).toEqual([]);
  });

  it('should let the app user read and write sessions without a current tenant', async () => {
    const client = new Client(testingPG.appConfig);
    await client.connect();
    try {
      await client.query(
        `INSERT INTO http_sessions (sid, sess, expire)
         VALUES ('sid-1', '{"passport":{"user":"abc///tenant"}}', to_timestamp($1))`,
        [Math.ceil(Date.now() / 1000) + 60]
      );
      await client.query(`UPDATE http_sessions SET sess = '{"passport":{"user":"abc///tenant"}}'`);
      const { rows } = await client.query('SELECT sid, sess FROM http_sessions');
      await client.query(`DELETE FROM http_sessions WHERE sid = 'sid-1'`);

      expect(rows).toEqual([{ sid: 'sid-1', sess: { passport: { user: 'abc///tenant' } } }]);
    } finally {
      await client.end();
    }
  });
});
