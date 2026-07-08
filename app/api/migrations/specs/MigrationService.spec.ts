import { Connection } from 'mongoose';
import testingDB from '#api/utils/testing_db.js';
import { DB } from '#api/odm/index.js';

jest.mock('#api/infrastructure/PostgresDB.js', () => ({
  PostgresDB: {
    connect: jest.fn(),
    disconnect: jest.fn().mockResolvedValue(undefined),
    pool: jest.fn().mockReturnValue({
      query: jest.fn().mockResolvedValue({ rows: [{ delta: 0 }] }),
    }),
  },
}));

jest.mock('#api/core/infrastructure/postgresql/PgMigrator.js', () => ({
  PgMigrator: jest.fn().mockImplementation(() => ({
    getCurrentVersion: jest.fn().mockResolvedValue(0),
    migrate: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('#api/core/infrastructure/jobs/MigrationJob.js', () => ({
  MigrationJob: class MigrationJobMock {
    static calls: any[] = [];

    async handleDispatch(_heartbeat: () => Promise<void>, params: any) {
      MigrationJobMock.calls.push(params);
    }
  },
}));

import { runNewMigration } from '#api/migrations/MigrationService.js';
import { MigrationJob } from '#api/core/infrastructure/jobs/MigrationJob.js';

const MockedMigrationJob =
  MigrationJob as unknown as typeof import('#api/core/infrastructure/jobs/MigrationJob.js').MigrationJob;

describe('MigrationService', () => {
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

  beforeEach(() => {
    (MockedMigrationJob as any).calls = [];
  });

  it('should dispatch MigrationJob in sync mode and return result', async () => {
    const result = await runNewMigration({ async: false, structuredLogs: false });

    expect(result).toEqual({
      done: true,
      appliedDataDeltas: [],
      appliedSchemaDeltas: [],
      schemaVersion: 0,
    });

    expect((MockedMigrationJob as any).calls).toHaveLength(1);
    expect((MockedMigrationJob as any).calls[0]).toEqual({
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });
  });

  it('should dispatch MigrationJob in async mode and return dispatched flag', async () => {
    const result = await runNewMigration({ async: true, structuredLogs: false });

    expect(result).toEqual({ dispatched: true });
    expect((MockedMigrationJob as any).calls).toHaveLength(1);
  });
});
