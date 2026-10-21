import { ObjectId } from 'mongodb';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresTransactionManager } from '../PostgresTransactionManager.js';
import { SyncLogWriter } from '../SyncLogWriter.js';

const TENANT = 'sync-log-writer-tenant';

const writerFor = (namespace: string) =>
  new SyncLogWriter(
    new PostgresTransactionManager(PostgresDB.knex, TENANT, LoggerFactory.forTests()),
    TENANT,
    namespace
  );

describe('SyncLogWriter', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingPG.clear(['updatelogs']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should keep a log per namespace when the same id is written in two collections', async () => {
    const id = new ObjectId().toHexString();

    await writerFor('entities').upsertSyncLogs([id]);
    await writerFor('connections').upsertSyncLogs([id], true);

    const rows = (await testingPG.getAllFrom('updatelogs'))
      .filter(row => row.tenant_id === TENANT)
      .map(row => ({ namespace: row.namespace, id: row.id, deleted: row.deleted }))
      .sort((left, right) => left.namespace.localeCompare(right.namespace));
    expect(rows).toEqual([
      { namespace: 'connections', id, deleted: true },
      { namespace: 'entities', id, deleted: false },
    ]);
  });

  it('should update the log in place when the same document is logged again', async () => {
    const id = new ObjectId().toHexString();

    await writerFor('entities').upsertSyncLogs([id]);
    await writerFor('entities').upsertSyncLogs([id], true);

    const rows = (await testingPG.getAllFrom('updatelogs')).filter(row => row.tenant_id === TENANT);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ namespace: 'entities', id, deleted: true });
  });
});
