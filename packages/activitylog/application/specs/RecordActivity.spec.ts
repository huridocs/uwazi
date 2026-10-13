import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { RecordActivityFactory } from '../../infrastructure/factories/RecordActivityFactory.js';
import type { RecordActivityInput } from '../RecordActivity.js';
import { seed, setUpBackends, testConfigs } from './ActivityLogContractFixtures.js';

const USER_ID = '5d9f1a2b3c4d5e6f7a8b9c0d';

const request: RecordActivityInput = {
  method: 'POST',
  url: '/api/entities',
  params: { some: 'params' },
  query: { a: 'query' },
  body: { title: 'Hi', password: '12345' },
  user: { id: USER_ID, username: 'admin' },
  statusCode: 200,
};

const IGNORED_ENDPOINTS = [
  '/api/login',
  '/api/contact',
  '/api/unlockaccount',
  '/api/resetpassword',
  '/api/recoverpassword',
  '/api/documents/pdfInfo',
  '/api/documents/download',
  '/api/attachments/download',
  '/api/semantic-search/notify-updates',
  '/api/sync',
  '/api/sync/upload',
  '/api/export',
];

/** Midnight of the day the entry was recorded, one year on — what the collection's TTL index reads. */
const expiryOf = (time: number) => {
  const expiry = new Date(time);
  expiry.setHours(0, 0, 0, 0);
  expiry.setFullYear(expiry.getFullYear() + 1);
  return expiry;
};

const mongoDocuments = async () =>
  (await testingEnvironment.db.getCollection('activitylogs')?.find().toArray()) ?? [];

const postgresRows = async () => testingEnvironment.pg.getAllFrom('activitylogs');

/** What the selected backend holds, in one shape whichever it is. */
const storedIn = async (postgresCore: boolean) =>
  postgresCore
    ? (await postgresRows()).map(row => ({
        id: String(row._id),
        method: row.method,
        url: row.url,
        params: row.params,
        query: row.query,
        body: row.body,
        userId: row.user_id,
        username: row.username,
        time: Number(row.time),
      }))
    : (await mongoDocuments()).map(doc => ({
        id: String(doc._id),
        method: doc.method,
        url: doc.url,
        params: doc.params,
        query: doc.query,
        body: doc.body,
        userId: doc.user ? String(doc.user) : null,
        username: doc.username ?? null,
        time: doc.time,
      }));

describe('RecordActivity', () => {
  const record = async (overrides: Partial<RecordActivityInput> = {}) =>
    testingEnvironment.runWithContext(async () =>
      RecordActivityFactory.default().execute({ ...request, ...overrides })
    );

  beforeAll(async () => {
    await setUpBackends();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    const stored = async () => storedIn(postgresCore);

    beforeEach(async () => {
      await seed(postgresCore, []);
    });

    it('should store the request, with the password masked', async () => {
      const before = Date.now();
      await record();
      const after = Date.now();

      const [entry, ...rest] = await stored();

      expect(rest).toEqual([]);
      expect(entry).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{24}$/),
        method: 'POST',
        url: '/api/entities',
        params: '{"some":"params"}',
        query: '{"a":"query"}',
        body: '{"title":"Hi","password":"*****"}',
        userId: USER_ID,
        username: 'admin',
        time: expect.any(Number),
      });
      expect(entry.time).toBeGreaterThanOrEqual(before);
      expect(entry.time).toBeLessThanOrEqual(after);
    });

    it('should store nothing in the other backend', async () => {
      await record();

      expect(await storedIn(!postgresCore)).toEqual([]);
    });

    it('should store a request made without a user with no user on it', async () => {
      await record({ user: null });

      expect(await stored()).toMatchObject([
        { url: '/api/entities', userId: null, username: null },
      ]);
    });

    it('should store a deletion', async () => {
      await record({ method: 'DELETE', url: '/api/users' });

      expect(await stored()).toMatchObject([{ method: 'DELETE', url: '/api/users' }]);
    });

    describe('requests that are not activity', () => {
      it('should ignore a request outside the API', async () => {
        await record({ url: '/entities' });

        expect(await stored()).toEqual([]);
      });

      it.each(['GET', 'OPTIONS', 'HEAD'])('should ignore a %s request', async method => {
        await record({ method });

        expect(await stored()).toEqual([]);
      });

      it.each(IGNORED_ENDPOINTS)('should ignore requests to %s', async url => {
        await record({ url });

        expect(await stored()).toEqual([]);
      });

      it.each([400, 401, 403, 404, 422, 500, 503])(
        'should ignore a request that failed with %s',
        async statusCode => {
          await record({ statusCode });

          expect(await stored()).toEqual([]);
        }
      );
    });

    it.each([200, 201, 204, 302])('should store a request answered with %s', async statusCode => {
      await record({ statusCode });

      expect(await stored()).toHaveLength(1);
    });

    describe('requests that carry no body', () => {
      it.each([
        ['an entity deletion', 'DELETE', '/api/entities', { sharedId: 'entity1' }],
        ['a deletion of users', 'DELETE', '/api/users', { ids: '["user1"]' }],
        ['an upload of nothing but a file', 'POST', '/api/files/upload/custom', {}],
        ['an upload of a document', 'POST', '/api/files/upload/document', {}],
        ['a request to any other endpoint', 'POST', '/api/templates', {}],
      ])('should store %s', async (_case, method, url, query) => {
        await record({ method, url, query, body: {} });

        expect(await stored()).toMatchObject([
          { method, url, query: JSON.stringify(query), body: '{}' },
        ]);
      });
    });
  });

  describe('in Mongo', () => {
    beforeEach(async () => {
      await seed(false, []);
    });

    it('should store the document the collection has always held, with a year to live', async () => {
      await record();

      const [document] = await mongoDocuments();

      expect(document).toEqual({
        _id: expect.any(ObjectId),
        method: 'POST',
        url: '/api/entities',
        params: '{"some":"params"}',
        query: '{"a":"query"}',
        body: '{"title":"Hi","password":"*****"}',
        user: new ObjectId(USER_ID),
        username: 'admin',
        time: expect.any(Number),
        expireAt: expiryOf(document.time),
      });
    });

    it('should leave the user fields out of a request made without a user', async () => {
      await record({ user: null });

      const [document] = await mongoDocuments();

      expect(document).not.toHaveProperty('user');
      expect(document).not.toHaveProperty('username');
    });
  });

  describe('in Postgres', () => {
    beforeEach(async () => {
      await seed(true, []);
    });

    it('should store the entry under the current tenant, with no expiry', async () => {
      await record();

      expect(await postgresRows()).toEqual([
        {
          _id: expect.stringMatching(/^[0-9a-f]{24}$/),
          tenant_id: testingTenants.current().name,
          method: 'POST',
          url: '/api/entities',
          params: '{"some":"params"}',
          query: '{"a":"query"}',
          body: '{"title":"Hi","password":"*****"}',
          user_id: USER_ID,
          username: 'admin',
          time: expect.any(Number),
        },
      ]);
    });
  });
});
