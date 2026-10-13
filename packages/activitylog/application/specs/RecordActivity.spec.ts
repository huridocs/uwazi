import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { RecordActivityFactory } from '../../infrastructure/factories/RecordActivityFactory.js';
import type { RecordActivityInput } from '../RecordActivity.js';

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

const BODY_REQUIRED_ENDPOINTS = [
  '/api/files/upload/document',
  '/api/files/upload/custom',
  '/api/attachments/upload',
  '/api/public',
  '/api/entities',
  '/api/users',
];

/** Midnight of the day the entry was recorded, one year on — what the collection's TTL index reads. */
const expiryOf = (time: number) => {
  const expiry = new Date(time);
  expiry.setHours(0, 0, 0, 0);
  expiry.setFullYear(expiry.getFullYear() + 1);
  return expiry;
};

describe('RecordActivity', () => {
  const record = async (overrides: Partial<RecordActivityInput> = {}) =>
    testingEnvironment.runWithContext(async () =>
      RecordActivityFactory.default().execute({ ...request, ...overrides })
    );

  const stored = async () => testingEnvironment.db.getAllFrom('activitylogs');

  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures({ activitylogs: [] });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should store the request, with the password masked and a year to live', async () => {
    const before = Date.now();
    await record();
    const after = Date.now();

    const [entry, ...rest] = await stored();

    expect(rest).toEqual([]);
    expect(entry).toEqual({
      _id: expect.any(ObjectId),
      method: 'POST',
      url: '/api/entities',
      params: '{"some":"params"}',
      query: '{"a":"query"}',
      body: '{"title":"Hi","password":"*****"}',
      user: new ObjectId(USER_ID),
      username: 'admin',
      time: expect.any(Number),
      expireAt: expiryOf(entry.time),
    });
    expect(entry.time).toBeGreaterThanOrEqual(before);
    expect(entry.time).toBeLessThanOrEqual(after);
  });

  it('should store a request made without a user with no user on it', async () => {
    await record({ user: null });

    const [entry] = await stored();

    expect(entry).not.toHaveProperty('user');
    expect(entry).not.toHaveProperty('username');
    expect(entry.url).toBe('/api/entities');
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

    it('should ignore a request to an endpoint that does not exist', async () => {
      await record({ statusCode: 404 });

      expect(await stored()).toEqual([]);
    });

    it.each(BODY_REQUIRED_ENDPOINTS)(
      'should ignore a request to %s that arrives without a body',
      async url => {
        await record({ url, body: {} });

        expect(await stored()).toEqual([]);
      }
    );

    it('should store a request without a body to any other endpoint', async () => {
      await record({ url: '/api/templates', body: {} });

      expect(await stored()).toMatchObject([{ url: '/api/templates', body: '{}' }]);
    });
  });
});
