/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { createSyncConfig } from '#api/sync/syncConfig.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';

const TARGET = 'sync-config-target';

describe('createSyncConfig update logs', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingDB.clear(['updatelogs', 'syncs']);
    await testingPG.clear(['updatelogs']);
    await testingDB
      .db(testingDB.dbName)
      .collection('syncs')
      .insertOne({
        name: TARGET,
        lastSyncs: { entities: 50 },
      });
  });

  const changesForEntities = async () =>
    testingEnvironment.runWithContext(async () => {
      const syncConfig = await createSyncConfig(
        {
          url: 'http://target',
          username: 'sync',
          password: 'sync',
          name: TARGET,
          config: {},
        },
        TARGET
      );
      return syncConfig.lastChangesForCollection('entities', 50, 50);
    });

  it('should read Postgres logs when postgresCore is on', async () => {
    testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: true } });
    const seen = new ObjectId();
    const ignored = new ObjectId();
    const tenantId = testingTenants.current().name;

    await testingPG.setFixtures({
      updatelogs: [
        {
          tenant_id: tenantId,
          id: seen.toHexString(),
          namespace: 'entities',
          timestamp: 80,
          deleted: false,
        },
        {
          tenant_id: tenantId,
          id: ignored.toHexString(),
          namespace: 'entities',
          timestamp: 40,
          deleted: false,
        },
      ],
    });
    await testingDB.db(testingDB.dbName).collection('updatelogs').insertOne({
      mongoId: new ObjectId(),
      namespace: 'entities',
      timestamp: 90,
      deleted: false,
    });

    const changes = await changesForEntities();

    expect(changes.map(change => change.mongoId.toString())).toEqual([seen.toHexString()]);
    expect(changes[0].deleted).toBe(false);
  });

  it('should read Mongo logs when postgresCore is off', async () => {
    testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: false } });
    const seen = new ObjectId();

    await testingDB.db(testingDB.dbName).collection('updatelogs').insertOne({
      mongoId: seen,
      namespace: 'entities',
      timestamp: 80,
      deleted: true,
    });
    await testingPG.setFixtures({
      updatelogs: [
        {
          tenant_id: testingTenants.current().name,
          id: new ObjectId().toHexString(),
          namespace: 'entities',
          timestamp: 90,
          deleted: false,
        },
      ],
    });

    const changes = await changesForEntities();

    expect(changes.map(change => change.mongoId.toString())).toEqual([seen.toHexString()]);
    expect(changes[0].deleted).toBe(true);
  });
});
