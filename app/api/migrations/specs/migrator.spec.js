import { toHaveBeenCalledBefore } from 'jest-extended';
import path from 'path';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import testingDB from '../../utils/testing_db.js';
import migrationsModel from '../migrationsModel.js';
import { migrator } from '../migrator.js';
import migration1 from './testMigrations/1-migrationTest.js';
import migration10 from './testMigrations/10-migrationTest.js';
import migration2 from './testMigrations/2-migrationTest.js';

expect.extend({ toHaveBeenCalledBefore });

describe('migrator', () => {
  let connection;
  beforeAll(async () => {
    await testingEnvironment.setUp({});
    connection = testingDB.mongodb;
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should have migrations directory configured', () => {
    expect(migrator.migrationsDir).toBe(path.normalize(`${__dirname}/../migrations/`));
  });

  describe('migrate', () => {
    beforeEach(async () => {
      await testingDB.clear();
      migrator.migrationsDir = path.join(__dirname, 'testMigrations');
      migrator.loader = p =>
        Promise.resolve(
          (function resolveModule(r) {
            const m = r(p);
            return m.default ?? m;
          })(require)
        );
      jest.spyOn(migration1, 'up');
      jest.spyOn(migration2, 'up');
      jest.spyOn(migration10, 'up');
    });

    it('should execute all migrations in order', async () => {
      const result = await migrator.migrate(connection.db, Number.MAX_SAFE_INTEGER);

      expect(migration1.up).toHaveBeenCalledWith(connection.db);
      expect(migration2.up).toHaveBeenCalledWith(connection.db);
      expect(migration10.up).toHaveBeenCalledWith(connection.db);
      expect(migration1.up).toHaveBeenCalledBefore(migration2.up);
      expect(migration2.up).toHaveBeenCalledBefore(migration10.up);
      expect(result.blocked).toBeNull();
    });

    it('should save migrations run on the db', async () => {
      await migrator.migrate(connection.db, Number.MAX_SAFE_INTEGER);

      const migrations = await migrationsModel.get();
      expect(
        migrations.map(({ delta, description, reindex }) => ({
          delta,
          description,
          reindex,
        }))
      ).toEqual([
        {
          delta: 1,
          description: 'migration test 1',
        },
        {
          delta: 2,
          description: 'migration test 2',
          reindex: true,
        },
        {
          delta: 3,
          description: 'migration test 3 blocked',
          reindex: false,
        },
        {
          delta: 10,
          description: 'migration test 10',
          reindex: false,
        },
      ]);
    });

    it('should only run migrations that had not been run before', async () => {
      migration1.up.mockClear();
      migration2.up.mockClear();
      migration10.up.mockClear();

      await migrationsModel.save({ delta: 1 });
      const result = await migrator.migrate(connection.db, Number.MAX_SAFE_INTEGER);

      expect(migration1.up).not.toHaveBeenCalled();
      expect(migration2.up).toHaveBeenCalledWith(connection.db);
      expect(migration10.up).toHaveBeenCalledWith(connection.db);
      expect(migration2.up).toHaveBeenCalledBefore(migration10.up);
      expect(result.blocked).toBeNull();
    });

    it('should not run any migration when the last one has already been run', async () => {
      migration1.up.mockClear();
      migration2.up.mockClear();
      migration10.up.mockClear();

      await migrationsModel.saveMultiple([{ delta: 1 }, { delta: 2 }, { delta: 3 }, { delta: 10 }]);
      const result = await migrator.migrate(connection.db, Number.MAX_SAFE_INTEGER);

      expect(migration1.up).not.toHaveBeenCalled();
      expect(migration2.up).not.toHaveBeenCalled();
      expect(migration10.up).not.toHaveBeenCalled();
      expect(result.blocked).toBeNull();
    });

    it('should run migrations up to the first blocked one', async () => {
      migration1.up.mockClear();
      migration2.up.mockClear();
      migration10.up.mockClear();

      const result = await migrator.migrate(connection.db, 99);

      expect(migration1.up).toHaveBeenCalledWith(connection.db);
      expect(migration2.up).toHaveBeenCalledWith(connection.db);
      expect(migration10.up).not.toHaveBeenCalled();
      expect(result.blocked).toEqual({ delta: 3, requiresSchema: 100 });
      expect(result.migrations).toHaveLength(2);
    });

    it('should skip all when first migration is blocked', async () => {
      migration1.up.mockClear();
      migration2.up.mockClear();
      migration10.up.mockClear();

      const result = await migrator.migrate(connection.db, -1);

      expect(migration1.up).not.toHaveBeenCalled();
      expect(result.blocked).toEqual({ delta: 1, requiresSchema: 0 });
      expect(result.migrations).toHaveLength(0);
    });
  });
});
