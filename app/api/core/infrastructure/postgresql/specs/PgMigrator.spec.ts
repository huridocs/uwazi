// eslint-disable-next-line node/no-restricted-import
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PgMigrator } from '../PgMigrator.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PgMigrator', () => {
  let migrationsDir: string;

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(() => {
    migrationsDir = path.join(__dirname, `test-migrations-${Date.now()}`);
    mkdirSync(migrationsDir, { recursive: true });
  });

  afterEach(async () => {
    rmSync(migrationsDir, { recursive: true, force: true });
    // Clean up any test tables
    const { pool } = testingEnvironment.pg;
    if (pool) {
      try {
        await pool.query('DROP TABLE IF EXISTS test_migrations_table');
        await pool.query('DROP TABLE IF EXISTS pg_migrations');
      } catch {
        // ignore cleanup errors
      }
    }
  });

  const createMigration = (fileName: string, sql: string) => {
    writeFileSync(path.join(migrationsDir, fileName), sql);
  };

  const getPool = () => {
    const { pool } = testingEnvironment.pg;
    if (!pool) throw new Error('PG pool not available');
    return pool;
  };

  describe('migrate', () => {
    it('should create pg_migrations tracking table on first run', async () => {
      createMigration(
        '001-create_test_table.sql',
        'CREATE TABLE test_migrations_table (id INT PRIMARY KEY)'
      );

      const pool = getPool();
      const migrator = new PgMigrator(migrationsDir, pool as any);
      await migrator.migrate();

      const result = await pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'pg_migrations'
        )`
      );
      expect(result.rows[0].exists).toBe(true);
    });

    it('should apply all pending migrations and record them', async () => {
      createMigration(
        '001-create_test_table.sql',
        'CREATE TABLE test_migrations_table (id INT PRIMARY KEY)'
      );
      createMigration(
        '002-add_name_column.sql',
        'ALTER TABLE test_migrations_table ADD COLUMN name TEXT'
      );

      const pool = getPool();
      const migrator = new PgMigrator(migrationsDir, pool as any);
      const applied = await migrator.migrate();

      expect(applied).toEqual([1, 2]);

      // Verify tracking table
      const records = await pool.query('SELECT delta, name FROM pg_migrations ORDER BY delta ASC');
      expect(records.rows).toHaveLength(2);
      expect(records.rows[0]).toMatchObject({ delta: 1, name: 'create_test_table' });
      expect(records.rows[1]).toMatchObject({ delta: 2, name: 'add_name_column' });

      // Verify schema was actually applied
      const columns = await pool.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = 'test_migrations_table'
         ORDER BY ordinal_position`
      );
      expect(columns.rows.map((r: any) => r.column_name)).toEqual(['id', 'name']);
    });

    it('should apply only pending migrations on subsequent runs', async () => {
      createMigration(
        '001-create_test_table.sql',
        'CREATE TABLE test_migrations_table (id INT PRIMARY KEY)'
      );

      const pool = getPool();
      const migrator = new PgMigrator(migrationsDir, pool as any);
      await migrator.migrate();

      // Add a new migration after first run
      createMigration(
        '002-add_name_column.sql',
        'ALTER TABLE test_migrations_table ADD COLUMN name TEXT'
      );

      const applied = await migrator.migrate();
      expect(applied).toEqual([2]);

      const records = await pool.query('SELECT delta FROM pg_migrations ORDER BY delta ASC');
      expect(records.rows.map((r: any) => r.delta)).toEqual([1, 2]);
    });

    it('should return empty array when no pending migrations', async () => {
      createMigration(
        '001-create_test_table.sql',
        'CREATE TABLE test_migrations_table (id INT PRIMARY KEY)'
      );

      const pool = getPool();
      const migrator = new PgMigrator(migrationsDir, pool as any);
      await migrator.migrate();
      const applied = await migrator.migrate();

      expect(applied).toEqual([]);
    });

    it('should wrap each migration in a transaction', async () => {
      createMigration(
        '001-valid_migration.sql',
        'CREATE TABLE test_migrations_table (id INT PRIMARY KEY)'
      );
      createMigration(
        '002-broken_migration.sql',
        'ALTER TABLE nonexistent_table ADD COLUMN foo TEXT'
      );
      createMigration(
        '003-should_not_run.sql',
        'ALTER TABLE test_migrations_table ADD COLUMN should_not_exist TEXT'
      );

      const pool = getPool();
      const migrator = new PgMigrator(migrationsDir, pool as any);

      await expect(migrator.migrate()).rejects.toThrow();

      // Migration 1 should have succeeded
      const tableExists = await pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'test_migrations_table'
        )`
      );
      expect(tableExists.rows[0].exists).toBe(true);

      // Migration 1 should be recorded
      const records = await pool.query('SELECT delta FROM pg_migrations ORDER BY delta ASC');
      expect(records.rows.map((r: any) => r.delta)).toEqual([1]);

      // Migration 3 should not have run
      const columnExists = await pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'test_migrations_table' AND column_name = 'should_not_exist'
        )`
      );
      expect(columnExists.rows[0].exists).toBe(false);
    });
  });

  describe('status', () => {
    it('should report all migrations as pending on empty database', async () => {
      createMigration('001-first.sql', 'SELECT 1');
      createMigration('002-second.sql', 'SELECT 2');

      const pool = getPool();
      const migrator = new PgMigrator(migrationsDir, pool as any);
      const { applied, pending } = await migrator.status();

      expect(applied).toHaveLength(0);
      expect(pending).toHaveLength(2);
      expect(pending.map((p: any) => p.delta)).toEqual([1, 2]);
    });

    it('should distinguish applied from pending migrations', async () => {
      createMigration('001-first.sql', 'SELECT 1');
      createMigration('002-second.sql', 'SELECT 2');
      createMigration('003-third.sql', 'SELECT 3');

      const pool = getPool();
      const migrator = new PgMigrator(migrationsDir, pool as any);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS pg_migrations (delta INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TIMESTAMP NOT NULL DEFAULT NOW())
      `);
      await pool.query('INSERT INTO pg_migrations (delta, name) VALUES (1, $1)', ['first']);

      const { applied, pending } = await migrator.status();

      expect(applied.map((a: any) => a.delta)).toEqual([1]);
      expect(pending.map((p: any) => p.delta)).toEqual([2, 3]);
    });
  });

  describe('getCurrentVersion', () => {
    it('should return 0 when no migrations applied', async () => {
      const pool = getPool();
      const migrator = new PgMigrator(migrationsDir, pool as any);
      const version = await migrator.getCurrentVersion();
      expect(version).toBe(0);
    });

    it('should return max applied delta', async () => {
      createMigration('001-first.sql', 'SELECT 1');
      createMigration('002-second.sql', 'SELECT 2');

      const pool = getPool();
      const migrator = new PgMigrator(migrationsDir, pool as any);
      await migrator.migrate();

      const version = await migrator.getCurrentVersion();
      expect(version).toBe(2);
    });
  });

  describe('migrateUntil', () => {
    it('should apply migrations up to the target version', async () => {
      createMigration('001-first.sql', 'SELECT 1');
      createMigration('002-second.sql', 'SELECT 2');
      createMigration('003-third.sql', 'SELECT 3');

      const pool = getPool();
      const migrator = new PgMigrator(migrationsDir, pool as any);
      const applied = await migrator.migrate(2);

      expect(applied).toEqual([1, 2]);

      const records = await pool.query('SELECT delta FROM pg_migrations ORDER BY delta ASC');
      expect(records.rows.map((r: any) => r.delta)).toEqual([1, 2]);
    });

    it('should apply nothing when target is already reached', async () => {
      createMigration('001-first.sql', 'SELECT 1');

      const pool = getPool();
      const migrator = new PgMigrator(migrationsDir, pool as any);
      await migrator.migrate();

      const applied = await migrator.migrate(1);
      expect(applied).toEqual([]);
    });

    it('should apply all when target is beyond last migration', async () => {
      createMigration('001-first.sql', 'SELECT 1');
      createMigration('002-second.sql', 'SELECT 2');

      const pool = getPool();
      const migrator = new PgMigrator(migrationsDir, pool as any);
      const applied = await migrator.migrate(999);

      expect(applied).toEqual([1, 2]);
    });
  });
});
