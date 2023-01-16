import { toHaveBeenCalledBefore } from 'jest-extended';
import path from 'path';

import migration1 from './testMigrations/1-migrationTest';
import migration10 from './testMigrations/10-migrationTest';
import migration2 from './testMigrations/2-migrationTest';
import migrationsModel from '../migrationsModel';
import { migrator } from '../migrator';
import testingDB from '../../utils/testing_db';

expect.extend({ toHaveBeenCalledBefore });

describe('migrator', () => {
  let connection;
  beforeAll(async () => {
    connection = await testingDB.connect();
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have migrations directory configured', () => {
    expect(migrator.migrationsDir).toBe(path.normalize(`${__dirname}/../migrations/`));
  });

  describe('migrate', () => {
    beforeEach(async () => {
      await testingDB.clear();
      migrator.migrationsDir = path.join(__dirname, 'testMigrations');
      jest.spyOn(migration1, 'up');
      jest.spyOn(migration2, 'up');
      jest.spyOn(migration10, 'up');
    });

    it('should execute all migrations in order', async () => {
      await migrator.migrate(connection.db);

      expect(migration1.up).toHaveBeenCalledWith(connection.db);
      expect(migration2.up).toHaveBeenCalledWith(connection.db);
      expect(migration10.up).toHaveBeenCalledWith(connection.db);
      expect(migration1.up).toHaveBeenCalledBefore(migration2.up);
      expect(migration2.up).toHaveBeenCalledBefore(migration10.up);
    });

    it('should save migrations run on the db', async () => {
      await migrator.migrate(connection.db);

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
      await migrator.migrate(connection.db);

      expect(migration1.up).not.toHaveBeenCalled();
      expect(migration2.up).toHaveBeenCalledWith(connection.db);
      expect(migration10.up).toHaveBeenCalledWith(connection.db);
      expect(migration2.up).toHaveBeenCalledBefore(migration10.up);
    });

    it('should only run migrations that had not been run before', async () => {
      migration1.up.mockClear();
      migration2.up.mockClear();
      migration10.up.mockClear();

      await migrationsModel.saveMultiple([{ delta: 1 }, { delta: 2 }]);
      await migrator.migrate(connection.db);

      expect(migration1.up).not.toHaveBeenCalled();
      expect(migration2.up).not.toHaveBeenCalled();
      expect(migration10.up).toHaveBeenCalledWith(connection.db);
    });

    it('should not run any migration when the last one has already been run', async () => {
      migration1.up.mockClear();
      migration2.up.mockClear();
      migration10.up.mockClear();

      await migrationsModel.saveMultiple([{ delta: 10 }]);
      await migrator.migrate(connection.db);

      expect(migration1.up).not.toHaveBeenCalled();
      expect(migration2.up).not.toHaveBeenCalled();
      expect(migration10.up).not.toHaveBeenCalled();
    });
  });
});
