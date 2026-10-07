import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ActivityLogQueryServiceFactory } from '../infrastructure/factories/ActivityLogQueryServiceFactory.js';

/** As the middleware stores them: every request detail is kept next to the four exposed fields. */
const stored = (
  fields: { method: string; url: string; time: number; username?: string },
  extra: object = {}
) => ({
  query: '{"q":"secret"}',
  params: '{"id":"1"}',
  body: '{"title":"secret"}',
  expireAt: new Date('2030-01-01T00:00:00.000Z'),
  ...fields,
  ...extra,
});

const fixtures = {
  activitylogs: [
    stored({ method: 'POST', url: '/api/entities', time: 1_000, username: 'admin' }),
    stored({ method: 'DELETE', url: '/api/files', time: 3_000, username: 'editor' }),
    stored({ method: 'PUT', url: '/api/templates', time: 2_000 }),
  ],
};

describe('ActivityLogQueryService', () => {
  const recent = async (limit: number) =>
    testingEnvironment.runWithContext(async () =>
      ActivityLogQueryServiceFactory.default().recent({ limit })
    );

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('recent', () => {
    it('should return the latest entries, newest first', async () => {
      expect((await recent(10)).map(entry => entry.time)).toEqual([3_000, 2_000, 1_000]);
    });

    it('should return only the requested number of entries', async () => {
      expect((await recent(2)).map(entry => entry.time)).toEqual([3_000, 2_000]);
    });

    it('should expose only method, url, username and time', async () => {
      expect((await recent(1))[0]).toEqual({
        method: 'DELETE',
        url: '/api/files',
        username: 'editor',
        time: 3_000,
      });
    });

    it('should report a missing username as null', async () => {
      const anonymous = (await recent(10)).find(entry => entry.time === 2_000);

      expect(anonymous).toEqual({
        method: 'PUT',
        url: '/api/templates',
        username: null,
        time: 2_000,
      });
    });
  });

  describe('entries made at the same time', () => {
    beforeAll(async () => {
      await testingEnvironment.setFixtures({
        activitylogs: [
          stored({ method: 'POST', url: '/api/first', time: 5_000 }),
          stored({ method: 'POST', url: '/api/second', time: 5_000 }),
          stored({ method: 'POST', url: '/api/third', time: 5_000 }),
        ],
      });
    });

    it('should return them in a stable order, the last stored first', async () => {
      expect((await recent(10)).map(entry => entry.url)).toEqual([
        '/api/third',
        '/api/second',
        '/api/first',
      ]);
    });
  });

  describe('when the tenant has no entries', () => {
    beforeAll(async () => {
      await testingEnvironment.setFixtures({ activitylogs: [] });
    });

    it('should return an empty list', async () => {
      expect(await recent(10)).toEqual([]);
    });
  });
});
