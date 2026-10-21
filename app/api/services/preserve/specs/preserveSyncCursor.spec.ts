import backend from 'fetch-mock';
import { ObjectId } from 'mongodb';
import { testingDB } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { preserveSync } from '../preserveSync.js';

const HOST = 'http://preserve-testing.org';
const TOKEN = 'auth-token';
const STORED = '2020-01-01T00:00:00.000Z';
const NEXT = '2020-06-01T00:00:00.000Z';

describe('preserveSync cursor on Postgres', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    backend.restore();
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    backend.restore();
    testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: true } });
    await testingDB.clear(['preservesyncs']);
    await testingPG.clear(['preserve_sync']);
  });

  it('should ask Preserve for evidences after the stored date and then save the new one', async () => {
    await testingPG.setFixtures({
      preserve_sync: [{ token: TOKEN, last_import: STORED }],
    });

    const requested: string[] = [];
    backend.get(
      (url: string) => {
        if (!url.startsWith(`${HOST}/api/evidences`)) return false;
        requested.push(url);
        return true;
      },
      JSON.stringify({ data: [{ attributes: { title: '', date: NEXT } }] })
    );

    await testingEnvironment.runWithContext(async () => {
      await preserveSync.sync({
        host: HOST,
        masterToken: 'master-token',
        config: [{ token: TOKEN, template: new ObjectId() }],
      });
    });

    expect(decodeURIComponent(requested[0])).toContain(`filter[date][gt]=${STORED}`);

    const rows = await testingPG.getAllFrom<{ token: string; last_import: string }>(
      'preserve_sync'
    );
    expect(rows.map(row => ({ token: row.token, lastImport: row.last_import }))).toEqual([
      { token: TOKEN, lastImport: NEXT },
    ]);

    const mongo = await testingDB.db(testingDB.dbName).collection('preservesyncs').find().toArray();
    expect(mongo).toEqual([]);
  });
});
