/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { UpdateLogsMigrationConfig } from '../UpdateLogsMigrationConfig.js';
import { UPDATE_LOGS_BATCH_SIZE } from '../copyUpdateLogs.js';

describe('UpdateLogsMigrationConfig', () => {
  it('should keep the mongo document id as the conflict key and drop the mongo _id', () => {
    const mongoId = new ObjectId();
    const mapped = UpdateLogsMigrationConfig.mapDocument({
      _id: new ObjectId(),
      mongoId,
      namespace: 'entities',
      timestamp: 100,
      deleted: false,
    });

    expect(UpdateLogsMigrationConfig.mongoCollection).toBe('updatelogs');
    expect(UpdateLogsMigrationConfig.pgTable).toBe('updatelogs');
    expect(UpdateLogsMigrationConfig.conflictColumns).toEqual(['tenant_id', 'namespace', 'id']);
    expect(mapped).toEqual({
      id: mongoId.toHexString(),
      namespace: 'entities',
      timestamp: 100,
      deleted: false,
    });
  });
});

describe('UpdateLogsMigrationConfig copy', () => {
  const TENANT = 'updatelogs-migration-tenant';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['updatelogs']);
    await testingPG.clear(['updatelogs']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should copy a log and preserve its timestamp', async () => {
    const mongoId = new ObjectId();
    await testingDB.db(testingDB.dbName).collection('updatelogs').insertOne({
      mongoId,
      namespace: 'files',
      timestamp: 100,
      deleted: true,
    });

    const result = await UpdateLogsMigrationConfig.copy(testingDB.db(testingDB.dbName), TENANT);

    expect(result).toEqual({ migrated: 1, orphansSkipped: 0, skipped: false });

    const rows = (await testingPG.getAllFrom('updatelogs')).filter(row => row.tenant_id === TENANT);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: mongoId.toHexString(),
      namespace: 'files',
      timestamp: 100,
      deleted: true,
    });
  });

  it.each([
    {
      order: 'later document first',
      first: { timestamp: 200, deleted: true },
      second: { timestamp: 100, deleted: false },
    },
    {
      order: 'earlier document first',
      first: { timestamp: 100, deleted: false },
      second: { timestamp: 200, deleted: true },
    },
  ])(
    'should keep the later log when one document was logged twice ($order)',
    async ({ first, second }) => {
      const mongoId = new ObjectId();
      await testingDB
        .db(testingDB.dbName)
        .collection('updatelogs')
        .insertMany([
          { _id: new ObjectId(), mongoId, namespace: 'connections', ...first },
          { _id: new ObjectId(), mongoId, namespace: 'connections', ...second },
        ]);

      const result = await UpdateLogsMigrationConfig.copy(testingDB.db(testingDB.dbName), TENANT);

      expect(result).toEqual({ migrated: 2, orphansSkipped: 0, skipped: false });

      const rows = (await testingPG.getAllFrom('updatelogs')).filter(
        row => row.tenant_id === TENANT
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        id: mongoId.toHexString(),
        namespace: 'connections',
        timestamp: 200,
        deleted: true,
      });
    }
  );

  it('should keep one log when both copies have the same timestamp', async () => {
    const mongoId = new ObjectId();
    await testingDB
      .db(testingDB.dbName)
      .collection('updatelogs')
      .insertMany([
        { mongoId, namespace: 'connections', timestamp: 100, deleted: true },
        { mongoId, namespace: 'connections', timestamp: 100, deleted: true },
      ]);

    const result = await UpdateLogsMigrationConfig.copy(testingDB.db(testingDB.dbName), TENANT);

    expect(result).toEqual({ migrated: 2, orphansSkipped: 0, skipped: false });
    const rows = (await testingPG.getAllFrom('updatelogs')).filter(row => row.tenant_id === TENANT);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ timestamp: 100, deleted: true });
  });

  it.each([
    { order: 'later log in a later batch', earlierIdTime: 1, laterIdTime: 10_000 },
    { order: 'later log in an earlier batch', earlierIdTime: 10_000, laterIdTime: 1 },
  ])(
    'should keep the later log when the two copies fall in different batches ($order)',
    async ({ earlierIdTime, laterIdTime }) => {
      const mongoId = new ObjectId();
      const fillers = Array.from({ length: UPDATE_LOGS_BATCH_SIZE - 1 }, (_, index) => ({
        _id: ObjectId.createFromTime(100 + index),
        mongoId: new ObjectId(),
        namespace: 'entities',
        timestamp: 1,
        deleted: false,
      }));
      await testingDB
        .db(testingDB.dbName)
        .collection('updatelogs')
        .insertMany([
          {
            _id: ObjectId.createFromTime(earlierIdTime),
            mongoId,
            namespace: 'connections',
            timestamp: 100,
            deleted: false,
          },
          ...fillers,
          {
            _id: ObjectId.createFromTime(laterIdTime),
            mongoId,
            namespace: 'connections',
            timestamp: 200,
            deleted: true,
          },
        ]);

      const result = await UpdateLogsMigrationConfig.copy(testingDB.db(testingDB.dbName), TENANT);

      expect(result).toEqual({
        migrated: UPDATE_LOGS_BATCH_SIZE + 1,
        orphansSkipped: 0,
        skipped: false,
      });
      const rows = (await testingPG.getAllFrom('updatelogs')).filter(
        row => row.tenant_id === TENANT && row.id === mongoId.toHexString()
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ timestamp: 200, deleted: true });
    }
  );

  it('should keep one log per namespace when the same id was logged in two collections', async () => {
    const mongoId = new ObjectId();
    await testingDB
      .db(testingDB.dbName)
      .collection('updatelogs')
      .insertMany([
        { mongoId, namespace: 'entities', timestamp: 100, deleted: false },
        { mongoId, namespace: 'connections', timestamp: 300, deleted: true },
      ]);

    await UpdateLogsMigrationConfig.copy(testingDB.db(testingDB.dbName), TENANT);

    const rows = (await testingPG.getAllFrom('updatelogs'))
      .filter(row => row.tenant_id === TENANT)
      .map(row => ({
        id: row.id,
        namespace: row.namespace,
        timestamp: Number(row.timestamp),
        deleted: row.deleted,
      }))
      .sort((left, right) => left.namespace.localeCompare(right.namespace));
    expect(rows).toEqual([
      { id: mongoId.toHexString(), namespace: 'connections', timestamp: 300, deleted: true },
      { id: mongoId.toHexString(), namespace: 'entities', timestamp: 100, deleted: false },
    ]);
  });
});
