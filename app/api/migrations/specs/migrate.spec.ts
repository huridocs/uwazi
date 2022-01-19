import testingDB from 'api/utils/testing_db';
import { migrator } from 'api/migrations/migrator';
import path from 'path';
import { run } from 'api/migrations/migrate';
import { Connection } from 'mongoose';
import { DB } from 'api/odm';

describe('migrate', () => {
  let connection: Connection;
  let stdoutSpy: jest.SpyInstance;

  beforeAll(async () => {
    connection = await testingDB.connect();
    jest.spyOn(DB, 'connectionForDB').mockReturnValue(connection);
    jest.spyOn(DB, 'disconnect').mockResolvedValue(Promise.resolve());
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  describe('run', () => {
    beforeEach(async () => {
      await testingDB.clear();
      migrator.migrationsDir = path.join(__dirname, 'testMigrations');
      stdoutSpy = jest.spyOn(process.stdout, 'write');
    });

    afterEach(() => {
      stdoutSpy.mockRestore();
    });

    it('should call migrator migrate', async () => {
      const migrateSpy = jest.spyOn(migrator, 'migrate');

      await run();

      expect(migrateSpy).toBeCalledWith(connection.db);
    });

    it('prints result when migrations do not need reindex', async () => {
      jest.spyOn(migrator, 'migrate').mockResolvedValue([
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
      ]);

      await run();

      expect(stdoutSpy).toBeCalledWith('{"reindex":false}');
    });

    it('prints result when migrations need reindex', async () => {
      jest.spyOn(migrator, 'migrate').mockResolvedValue([
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
      ]);

      await run();

      expect(stdoutSpy).toBeCalledWith('{"reindex":true}');
    });
  });
});
