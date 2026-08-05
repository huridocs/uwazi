import { toHaveBeenCalledBefore } from 'jest-extended';
import path from 'path';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import testingDB from '../../utils/testing_db.js';
import migrationsModel from '../migrationsModel.js';
import { migrator } from '../migrator.js';

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

  const loadedModules = new Map();

  const loadMigration = (p, registry) => {
    let migration = loadedModules.get(p);
    if (!migration) {
      const normalized = path.resolve(p);
      delete require.cache[normalized];
      const m = require(normalized);
      migration = m.default ?? m;
      loadedModules.set(p, migration);
    }
    if (!migration.up._isMockFunction) {
      jest.spyOn(migration, 'up');
    }
    registry.push(migration);
    return migration;
  };

  const clearMigrationMocks = () => {
    loadedModules.forEach(migration => {
      if (migration.up._isMockFunction) {
        migration.up.mockClear();
      }
    });
  };

  const setTestMigrationsDir = (registry = []) => {
    migrator.migrationsDir = path.join(__dirname, 'testMigrations');
    migrator.loader = p => Promise.resolve(loadMigration(p, registry));
  };

  describe('migrate', () => {
    let loadedMigrations;

    beforeEach(async () => {
      clearMigrationMocks();
      await testingDB.clear();
      loadedMigrations = [];
      setTestMigrationsDir(loadedMigrations);
    });

    it('should execute all migrations in order', async () => {
      const result = await migrator.migrate(connection.db, Number.MAX_SAFE_INTEGER);

      expect(result.migrations.map(m => m.delta)).toEqual([1, 2, 3, 10]);
      result.migrations.forEach((migration, index) => {
        expect(migration.up).toHaveBeenCalledWith(connection.db);
        if (index > 0) {
          const previous = result.migrations[index - 1];
          expect(previous.up).toHaveBeenCalledBefore(migration.up);
        }
      });
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
      await migrationsModel.save({ delta: 1 });
      const result = await migrator.migrate(connection.db, Number.MAX_SAFE_INTEGER);

      const migration1 = loadedMigrations.find(m => m.delta === 1);
      const migration2 = result.migrations.find(m => m.delta === 2);
      const migration10 = result.migrations.find(m => m.delta === 10);

      expect(migration1.up).not.toHaveBeenCalled();
      expect(migration2.up).toHaveBeenCalledWith(connection.db);
      expect(migration10.up).toHaveBeenCalledWith(connection.db);
      expect(migration2.up).toHaveBeenCalledBefore(migration10.up);
      expect(result.blocked).toBeNull();
    });

    it('should not run any migration when the last one has already been run', async () => {
      await migrationsModel.saveMultiple([{ delta: 1 }, { delta: 2 }, { delta: 3 }, { delta: 10 }]);
      const result = await migrator.migrate(connection.db, Number.MAX_SAFE_INTEGER);

      expect(result.migrations).toHaveLength(0);
      expect(result.blocked).toBeNull();
    });

    it('should run migrations up to the first blocked one', async () => {
      const result = await migrator.migrate(connection.db, 99);

      const migration1 = loadedMigrations.find(m => m.delta === 1);
      const migration2 = result.migrations.find(m => m.delta === 2);
      const migration10 = loadedMigrations.find(m => m.delta === 10);

      expect(migration1.up).toHaveBeenCalledWith(connection.db);
      expect(migration2.up).toHaveBeenCalledWith(connection.db);
      expect(migration10.up).not.toHaveBeenCalled();
      expect(result.blocked).toEqual({ delta: 3, requiresSchema: 100 });
      expect(result.migrations).toHaveLength(2);
    });

    it('should skip all when first migration is blocked', async () => {
      const result = await migrator.migrate(connection.db, -1);

      expect(result.migrations).toHaveLength(0);
      expect(result.blocked).toEqual({ delta: 1, requiresSchema: 0 });
    });
  });

  describe('migrateNext', () => {
    beforeEach(async () => {
      await testingDB.clear();
      setTestMigrationsDir();
    });

    it('should apply only the next pending migration', async () => {
      const result = await migrator.migrateNext(connection.db, Number.MAX_SAFE_INTEGER);

      expect(result.status).toBe('applied');
      expect(result.migration.delta).toBe(1);
      expect(result.migration.up).toHaveBeenCalledWith(connection.db);
    });

    it('should return done when there are no pending migrations', async () => {
      await migrationsModel.saveMultiple([{ delta: 1 }, { delta: 2 }, { delta: 3 }, { delta: 10 }]);

      const result = await migrator.migrateNext(connection.db, Number.MAX_SAFE_INTEGER);

      expect(result.status).toBe('done');
    });

    it('should return blocked when next migration requires a newer schema', async () => {
      await migrationsModel.saveMultiple([{ delta: 1 }, { delta: 2 }]);

      const result = await migrator.migrateNext(connection.db, 99);

      expect(result.status).toBe('blocked');
      expect(result.blocked).toEqual({ delta: 3, requiresSchema: 100 });
    });

    it('should apply the next migration after one has already been applied', async () => {
      await migrationsModel.save({ delta: 1 });

      const result = await migrator.migrateNext(connection.db, Number.MAX_SAFE_INTEGER);

      expect(result.status).toBe('applied');
      expect(result.migration.delta).toBe(2);
      expect(result.migration.up).toHaveBeenCalledWith(connection.db);
    });
  });

  describe('migrateDelta', () => {
    beforeEach(async () => {
      await testingDB.clear();
      setTestMigrationsDir();
    });

    it('should apply a specific pending migration', async () => {
      const result = await migrator.migrateDelta(connection.db, 2, Number.MAX_SAFE_INTEGER);

      expect(result.status).toBe('applied');
      expect(result.migration.delta).toBe(2);
      expect(result.migration.up).toHaveBeenCalledWith(connection.db);
    });

    it('should return done when the specific migration has already been applied', async () => {
      await migrationsModel.save({ delta: 2 });

      const result = await migrator.migrateDelta(connection.db, 2, Number.MAX_SAFE_INTEGER);

      expect(result.status).toBe('done');
    });

    it('should return blocked when the specific migration requires a newer schema', async () => {
      await migrationsModel.saveMultiple([{ delta: 1 }, { delta: 2 }]);

      const result = await migrator.migrateDelta(connection.db, 3, 99);

      expect(result.status).toBe('blocked');
      expect(result.blocked).toEqual({ delta: 3, requiresSchema: 100 });
    });

    it('should return done when the specific migration is not pending and not blocked', async () => {
      const result = await migrator.migrateDelta(connection.db, 99, Number.MAX_SAFE_INTEGER);

      expect(result.status).toBe('done');
    });
  });
});
