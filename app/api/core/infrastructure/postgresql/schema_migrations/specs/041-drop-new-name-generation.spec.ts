import { testingEnvironment } from '#api/utils/testingEnvironment.js';

describe('041-drop-new-name-generation', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should drop settings.new_name_generation', async () => {
    const { pool } = testingEnvironment.pg;
    if (!pool) throw new Error('PG pool not available');
    const { rows } = await pool.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'settings' AND column_name = 'new_name_generation'`
    );

    expect(rows).toEqual([]);
  });
});
