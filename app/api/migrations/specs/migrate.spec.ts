import { Connection } from 'mongoose';
import path from 'path';
import testingDB from '#api/utils/testing_db.js';
import { DB } from '#api/odm/index.js';
import { migrator } from '#api/migrations/migrator.js';
import { runMigration } from '#api/migrations/migrate.js';

jest.mock('#api/infrastructure/PostgresDB.js', () => ({
  PostgresDB: {
    connect: jest.fn(),
    disconnect: jest.fn().mockResolvedValue(undefined),
    pool: jest.fn().mockReturnValue({
      query: jest.fn().mockResolvedValue({ rows: [{ delta: 15 }] }),
    }),
    adminPool: jest.fn().mockReturnValue({
      query: jest.fn().mockResolvedValue({ rows: [{ delta: 15 }] }),
    }),
  },
}));

jest.mock('#api/core/infrastructure/postgresql/PgMigrator.js', () => ({
  PgMigrator: jest.fn().mockImplementation(() => ({
    getCurrentVersion: jest.fn().mockResolvedValue(15),
  })),
}));

describe('migrate', () => {
  let connection: Connection;

  beforeAll(async () => {
    connection = await testingDB.connect();
    jest.spyOn(DB, 'connectionForDB').mockReturnValue(connection);
    jest.spyOn(DB, 'connect').mockResolvedValue(Promise.resolve(connection));
    jest.spyOn(DB, 'disconnect').mockResolvedValue(Promise.resolve());
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  describe('run', () => {
    beforeEach(async () => {
      await testingDB.clear();
      migrator.migrationsDir = path.join(__dirname, 'testMigrations');
      migrator.loader = async (p: string) =>
        Promise.resolve(
          (function resolveModule(r: NodeRequire) {
            const m = r(p);
            return m.default ?? m;
          })(require)
        );
    });

    it('should call migrator migrate with db and schema version', async () => {
      const migrateSpy = jest
        .spyOn(migrator, 'migrate')
        .mockResolvedValue({ migrations: [], blocked: null });

      await runMigration();

      expect(migrateSpy).toBeCalledWith(connection.db, 15);
    });

    it('returns applied migrations with reindex and schema version', async () => {
      jest.spyOn(migrator, 'migrate').mockResolvedValue({
        migrations: [
          {
            _id: '61e6b524f5de4b24d561391b',
            delta: 1,
            description: 'migration test 1',
            migrationDate: '2022-01-18T12:40:04.618Z',
            __v: 0,
          },
          {
            _id: '61e6b524f5de4b24d5613920',
            delta: 2,
            description: 'migration test 2',
            reindex: false,
            migrationDate: '2022-01-18T12:40:04.645Z',
            __v: 0,
          },
          {
            _id: '61e6b524f5de4b24d5613924',
            delta: 10,
            description: 'migration test 10',
            migrationDate: '2022-01-18T12:40:04.660Z',
            __v: 0,
          },
        ],
        blocked: null,
      });

      const result = await runMigration();

      expect(result).toEqual({
        migrated: true,
        applied: [1, 2, 10],
        reindex: false,
        schemaVersion: 15,
      });
    });

    it('returns reindex true when any migration needs reindex', async () => {
      jest.spyOn(migrator, 'migrate').mockResolvedValue({
        migrations: [
          {
            _id: testingDB.id(),
            delta: 1,
            description: 'migration test 1',
            migrationDate: '2022-01-18T12:40:04.618Z',
            __v: 0,
          },
          {
            _id: testingDB.id(),
            delta: 2,
            description: 'migration test 2',
            reindex: true,
            migrationDate: '2022-01-18T12:40:04.645Z',
            __v: 0,
          },
          {
            _id: testingDB.id(),
            delta: 10,
            description: 'migration test 10',
            reindex: false,
            migrationDate: '2022-01-18T12:40:04.660Z',
            __v: 0,
          },
        ],
        blocked: null,
      });

      const result = await runMigration();
      expect(result).toEqual({
        migrated: true,
        applied: [1, 2, 10],
        reindex: true,
        schemaVersion: 15,
      });
    });

    it('returns migrated false when there are no pending migrations', async () => {
      jest.spyOn(migrator, 'migrate').mockResolvedValue({ migrations: [], blocked: null });

      const result = await runMigration();

      expect(result).toEqual({
        migrated: false,
        applied: [],
        reindex: false,
        schemaVersion: 15,
      });
    });

    it('returns blocked info when migration requires newer schema', async () => {
      jest.spyOn(migrator, 'migrate').mockResolvedValue({
        migrations: [
          { _id: testingDB.id(), delta: 1, description: 'migration test 1', reindex: false },
        ],
        blocked: { delta: 2, requiresSchema: 18 },
      });

      const result = await runMigration();

      expect(result).toEqual({
        blocked: { delta: 2, requiresSchema: 18 },
        currentSchema: 15,
      });
    });
  });
});
