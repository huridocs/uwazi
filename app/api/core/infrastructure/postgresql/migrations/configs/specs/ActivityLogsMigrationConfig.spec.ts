import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '../../MigrateCollectionToPostgres.js';
import { ActivityLogsMigrationConfig } from '../ActivityLogsMigrationConfig.js';

const ENTRY_ID = '5d9f1a2b3c4d5e6f7a8b9c0d';
const USER_ID = '5d9f1a2b3c4d5e6f7a8b9c0e';

/** As the middleware has stored entries since 2020, with what mongoose added. */
const entry = {
  _id: new ObjectId(ENTRY_ID),
  method: 'POST',
  url: '/api/entities',
  params: '{}',
  query: '{"a":"query"}',
  body: '{"_id":"1","title":"Hi"}',
  user: new ObjectId(USER_ID),
  username: 'admin',
  time: 1_700_000_000_000,
  expireAt: new Date('2030-01-01T00:00:00.000Z'),
  __v: 0,
};

describe('ActivityLogsMigrationConfig', () => {
  it('should copy activitylogs to activitylogs, keyed by tenant and id', () => {
    expect(ActivityLogsMigrationConfig.mongoCollection).toBe('activitylogs');
    expect(ActivityLogsMigrationConfig.pgTable).toBe('activitylogs');
    expect(ActivityLogsMigrationConfig.conflictColumns).toEqual(['tenant_id', '_id']);
  });

  it('should keep the entry and its id, and drop its expiry', () => {
    expect(ActivityLogsMigrationConfig.mapDocument(entry)).toEqual({
      _id: ENTRY_ID,
      method: 'POST',
      url: '/api/entities',
      params: '{}',
      query: '{"a":"query"}',
      body: '{"_id":"1","title":"Hi"}',
      user_id: USER_ID,
      username: 'admin',
      time: 1_700_000_000_000,
    });
  });

  it('should keep the request details exactly as text', () => {
    const body = '{"b":1,  "a":{"password":"*****"}}';

    expect(ActivityLogsMigrationConfig.mapDocument({ ...entry, body }).body).toBe(body);
  });

  it('should leave empty what an old entry does not have', () => {
    const { params, query, body, user, username, ...old } = entry;

    expect(ActivityLogsMigrationConfig.mapDocument(old)).toMatchObject({
      params: null,
      query: null,
      body: null,
      user_id: null,
      username: null,
    });
  });

  it('should take an entry a migration logged, with its empty details and no user', () => {
    const logged = {
      _id: new ObjectId(ENTRY_ID),
      url: '',
      method: 'MIGRATE',
      params: '',
      query: '',
      body: '{"type":"fieldParseError"}',
      user: null,
      username: 'System',
      time: 5,
    };

    expect(ActivityLogsMigrationConfig.mapDocument(logged)).toEqual({
      _id: ENTRY_ID,
      method: 'MIGRATE',
      url: '',
      params: '',
      query: '',
      body: '{"type":"fieldParseError"}',
      user_id: null,
      username: 'System',
      time: 5,
    });
  });

  it('should turn details stored as something other than text into their JSON', () => {
    expect(
      ActivityLogsMigrationConfig.mapDocument({ ...entry, body: { title: 'Hi' }, query: {} })
    ).toMatchObject({ body: '{"title":"Hi"}', query: '{}' });
  });
});

describe('ActivityLogsMigrationConfig copy', () => {
  const TENANT = 'activitylogs-migration-tenant';

  const mongo = () => testingDB.db(testingDB.dbName).collection('activitylogs');

  const copy = async (options?: { force: boolean }) =>
    new MigrateCollectionToPostgres(testingDB.db(testingDB.dbName), TENANT).migrate(
      ActivityLogsMigrationConfig,
      options
    );

  const copied = async () =>
    (await testingPG.getAllFrom('activitylogs'))
      .filter(row => row.tenant_id === TENANT)
      .sort((a, b) => Number(a.time) - Number(b.time));

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['activitylogs']);
    await testingPG.clear(['activitylogs']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should copy every entry under the tenant', async () => {
    await mongo().insertMany([
      { ...entry },
      { method: 'PUT', url: '/api/old', time: 1_000 },
      {
        method: 'DELETE',
        url: '/api/entities',
        query: '{"sharedId":"x"}',
        body: '{}',
        time: 2_000,
      },
    ]);

    expect(await copy()).toEqual({ migrated: 3, orphansSkipped: 0, skipped: false });

    expect(await copied()).toMatchObject([
      { method: 'PUT', url: '/api/old', params: null, query: null, body: null, username: null },
      { method: 'DELETE', url: '/api/entities', query: '{"sharedId":"x"}', body: '{}' },
      {
        _id: ENTRY_ID,
        method: 'POST',
        body: '{"_id":"1","title":"Hi"}',
        user_id: USER_ID,
        username: 'admin',
      },
    ]);
  });

  it('should copy more entries than fit in one batch', async () => {
    await mongo().insertMany(
      Array.from({ length: 120 }, (_, index) => ({ method: 'POST', url: '/api/x', time: index }))
    );

    expect(await copy()).toMatchObject({ migrated: 120 });
    expect(await copied()).toHaveLength(120);
  });

  it('should copy nothing from an empty collection', async () => {
    expect(await copy()).toMatchObject({ migrated: 0 });
    expect(await copied()).toEqual([]);
  });

  it('should add only the entries logged since, when forced to run again', async () => {
    await mongo().insertOne({ ...entry });
    await copy();
    await mongo().insertOne({ method: 'PUT', url: '/api/later', time: 1_800_000_000_000 });

    await copy({ force: true });

    expect((await copied()).map(row => row.url)).toEqual(['/api/entities', '/api/later']);
  });
});
