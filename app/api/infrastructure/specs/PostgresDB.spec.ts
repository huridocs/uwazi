import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { PostgresDB } from '../PostgresDB.js';

describe('PostgresDB', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('adminKnex', () => {
    it('should connect with the same credentials as the admin pool', async () => {
      const fromPool = await PostgresDB.adminPool().query('SELECT current_user AS name');
      const fromKnex = await PostgresDB.adminKnex().raw('SELECT current_user AS name');

      expect(fromKnex.rows[0].name).toBe(fromPool.rows[0].name);
    });

    it('should set lock and statement timeouts on every connection', async () => {
      const lock = await PostgresDB.adminKnex().raw('SHOW lock_timeout');
      const statement = await PostgresDB.adminKnex().raw('SHOW statement_timeout');

      expect(lock.rows[0].lock_timeout).toBe('10s');
      expect(statement.rows[0].statement_timeout).toBe('5min');
    });
  });
});
