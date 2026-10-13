import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ActivityLogQueryServiceFactory } from '../../infrastructure/factories/ActivityLogQueryServiceFactory.js';
import type { ActivityLogFilters } from '../contracts/ActivityLogQueryService.js';
import {
  listEntries,
  NEWEST_FIRST,
  seed,
  setUpBackends,
  StoredEntry,
  T,
  testConfigs,
} from './ActivityLogContractFixtures.js';

/** As the middleware stores them: every request detail is kept next to the four exposed fields. */
const stored = (fields: {
  method: string;
  url: string;
  time: number;
  username?: string;
}): StoredEntry => ({
  query: '{"q":"secret"}',
  params: '{"id":"1"}',
  body: '{"title":"secret"}',
  ...fields,
});

describe('ActivityLogQueryService', () => {
  beforeAll(async () => {
    await setUpBackends();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    describe('recent', () => {
      const recent = async (limit: number) =>
        testingEnvironment.runWithContext(async () =>
          ActivityLogQueryServiceFactory.default().recent({ limit })
        );

      describe('with entries', () => {
        beforeAll(async () => {
          await seed(postgresCore, [
            stored({ method: 'POST', url: '/api/entities', time: 1_000, username: 'admin' }),
            stored({ method: 'DELETE', url: '/api/files', time: 3_000, username: 'editor' }),
            stored({ method: 'PUT', url: '/api/templates', time: 2_000 }),
          ]);
        });

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
          await seed(postgresCore, [
            stored({ method: 'POST', url: '/api/first', time: 5_000 }),
            stored({ method: 'POST', url: '/api/second', time: 5_000 }),
            stored({ method: 'POST', url: '/api/third', time: 5_000 }),
          ]);
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
          await seed(postgresCore, []);
        });

        it('should return an empty list', async () => {
          expect(await recent(10)).toEqual([]);
        });
      });
    });

    describe('list', () => {
      const list = async (filters: ActivityLogFilters = {}) =>
        testingEnvironment.runWithContext(async () =>
          ActivityLogQueryServiceFactory.default().list(filters)
        );

      const times = async (filters: ActivityLogFilters = {}) =>
        (await list(filters)).rows.map(row => row.time);

      beforeAll(async () => {
        await seed(postgresCore, listEntries);
      });

      it('should return every entry, newest first', async () => {
        expect(await times()).toEqual(NEWEST_FIRST);
      });

      it('should return each entry with what the request carried', async () => {
        const { rows } = await list({ url: '/api/templates' });

        expect(rows).toEqual([
          {
            id: expect.any(String),
            method: 'PUT',
            url: '/api/templates',
            params: null,
            query: '{}',
            body: '{}',
            userId: null,
            username: 'Hello',
            time: T.templatesPut,
            semantic: expect.any(Object),
          },
        ]);
      });

      it('should describe what each entry did', async () => {
        const { rows } = await list();

        expect(rows.find(row => row.time === T.entitiesDelete)?.semantic).toEqual({
          action: 'DELETE',
          description: 'Deleted entity',
          name: '123',
        });
        expect(rows.find(row => row.time === T.entitiesHelloPut)?.semantic).toEqual({
          action: 'RAW',
          description: '',
          extra: 'PUT: /api/entities/Hello',
        });
      });

      describe('when filtering', () => {
        it('should filter by method', async () => {
          expect(await times({ actions: ['POST'] })).toEqual([T.entitiesPost, T.entitiesCreate]);
        });

        it('should take deleting as a DELETE that names what it deletes', async () => {
          expect(await times({ actions: ['delete'] })).toEqual([T.entitiesDelete]);
        });

        it('should take updating as a request to an updating route that names an existing record', async () => {
          expect(await times({ actions: ['update'] })).toEqual([]);
        });

        it('should find nothing for a method no entry was made with', async () => {
          expect(await times({ actions: ['PATCH'] })).toEqual([]);
        });

        it('should filter by a time range, including the whole last day', async () => {
          expect(await times({ time: { from: T.entitiesCreate, to: T.entitiesHelloPut } })).toEqual(
            [T.entitiesHelloPut, T.entitiesCreate]
          );
        });

        it('should return everything for a time range with no bounds', async () => {
          expect(await times({ time: {} })).toEqual(NEWEST_FIRST);
        });

        it('should filter by the exact url', async () => {
          expect(await times({ url: '/api/entities' })).toEqual([
            T.entitiesPost,
            T.entitiesPut,
            T.entitiesCreate,
            T.entitiesDelete,
          ]);
        });

        it('should filter by text in the query', async () => {
          expect(await times({ query: '123' })).toEqual([T.entitiesPost, T.entitiesDelete]);
        });

        it('should filter by text in the body', async () => {
          expect(await times({ body: 'Hello' })).toEqual([T.entitiesCreate]);
        });

        it('should filter by username', async () => {
          expect(await times({ username: 'admin' })).toEqual([T.entitiesCreate, T.entitiesDelete]);
        });

        it('should filter by requests made without a user', async () => {
          const { rows } = await list({ username: 'anonymous' });

          expect(rows.map(row => row.time)).toEqual([
            T.entitiesPost,
            T.entitiesPut,
            T.entitiesHelloPut,
          ]);
          expect(rows.map(row => row.username)).toEqual([null, null, null]);
        });

        it('should take the characters of a search literally', async () => {
          expect(await times({ find: '.*' })).toEqual([]);
          expect(await times({ find: '{"sharedId":"123"}' })).toEqual([
            T.entitiesPost,
            T.entitiesDelete,
          ]);
          expect(await times({ search: '(' })).toEqual([]);
        });

        it('should search anywhere in the request when no description contains the text', async () => {
          expect(await times({ search: 'entity 1' })).toEqual([T.entitiesPost]);
        });

        it('should find a term anywhere in the request, whatever its case', async () => {
          expect(await times({ find: 'hello' })).toEqual([
            T.entitiesPut,
            T.entitiesHelloPut,
            T.entitiesCreate,
          ]);
        });

        it('should search by the description of what an entry did', async () => {
          expect(await times({ search: 'Deleted entity' })).toEqual([T.entitiesDelete]);
        });

        it('should search by the kind of action', async () => {
          expect(await times({ search: 'create' })).toEqual([T.entitiesPost, T.entitiesCreate]);
        });

        it('should combine an action with a search term', async () => {
          expect(await times({ actions: ['create'], search: 'Hello' })).toEqual([T.entitiesCreate]);
        });

        it('should combine several filters', async () => {
          expect(
            await times({ url: '/api/entities', username: 'admin', actions: ['POST'] })
          ).toEqual([T.entitiesCreate]);
        });
      });

      describe('when loading more through "before"', () => {
        it('should return the entries older than the given time', async () => {
          expect(await list({ limit: 2 })).toMatchObject({
            rows: [{ time: T.entitiesPost }, { time: T.entitiesPut }],
            remainingRows: 4,
            totalRows: 6,
            limit: 2,
          });

          expect(await list({ before: T.entitiesHelloPut, limit: 2 })).toMatchObject({
            rows: [{ time: T.entitiesCreate }, { time: T.entitiesDelete }],
            remainingRows: 1,
            totalRows: 3,
            limit: 2,
          });
        });
      });

      describe('when paginating', () => {
        it('should default to pages of 15', async () => {
          expect(await list()).toMatchObject({ limit: 15, remainingRows: 0, totalRows: 6 });
          expect((await list()).page).toBeUndefined();
        });

        it.each([
          { page: 1, expected: [T.entitiesPost, T.entitiesPut], remainingRows: 4 },
          { page: 2, expected: [T.entitiesHelloPut, T.entitiesCreate], remainingRows: 2 },
          { page: 3, expected: [T.entitiesDelete, T.templatesPut], remainingRows: 0 },
          { page: 4, expected: [], remainingRows: 0 },
        ])('should return page $page', async ({ page, expected, remainingRows }) => {
          const result = await list({ page, limit: 2 });

          expect(result.rows.map(row => row.time)).toEqual(expected);
          expect(result).toMatchObject({ page, limit: 2, remainingRows, totalRows: 6 });
        });

        it('should paginate what the filters leave', async () => {
          expect(await list({ page: 1, limit: 2, actions: ['PUT'] })).toMatchObject({
            rows: [{ time: T.entitiesPut }, { time: T.entitiesHelloPut }],
            remainingRows: 1,
          });
          expect(await list({ page: 2, limit: 2, actions: ['PUT'] })).toMatchObject({
            rows: [{ time: T.templatesPut }],
            remainingRows: 0,
          });
        });
      });

      describe('when sorting', () => {
        it.each([
          {
            prop: 'method' as const,
            asc: [
              T.entitiesDelete,
              T.entitiesPost,
              T.entitiesCreate,
              T.entitiesPut,
              T.entitiesHelloPut,
              T.templatesPut,
            ],
            desc: [
              T.entitiesPut,
              T.entitiesHelloPut,
              T.templatesPut,
              T.entitiesPost,
              T.entitiesCreate,
              T.entitiesDelete,
            ],
          },
          {
            prop: 'username' as const,
            asc: NEWEST_FIRST,
            desc: [
              T.templatesPut,
              T.entitiesCreate,
              T.entitiesDelete,
              T.entitiesPost,
              T.entitiesPut,
              T.entitiesHelloPut,
            ],
          },
          {
            prop: 'url' as const,
            asc: [
              T.entitiesPost,
              T.entitiesPut,
              T.entitiesCreate,
              T.entitiesDelete,
              T.entitiesHelloPut,
              T.templatesPut,
            ],
            desc: [
              T.templatesPut,
              T.entitiesHelloPut,
              T.entitiesPost,
              T.entitiesPut,
              T.entitiesCreate,
              T.entitiesDelete,
            ],
          },
          { prop: 'time' as const, asc: [...NEWEST_FIRST].reverse(), desc: NEWEST_FIRST },
        ])('should sort by $prop, newest first within equals', async ({ prop, asc, desc }) => {
          expect(await times({ sort: { prop, asc: true } })).toEqual(asc);
          expect(await times({ sort: { prop, asc: false } })).toEqual(desc);
        });

        it('should sort what the filters leave', async () => {
          expect(await times({ sort: { prop: 'username', asc: true }, actions: ['PUT'] })).toEqual([
            T.entitiesPut,
            T.entitiesHelloPut,
            T.templatesPut,
          ]);
          expect(await times({ sort: { prop: 'username', asc: false }, actions: ['PUT'] })).toEqual(
            [T.templatesPut, T.entitiesPut, T.entitiesHelloPut]
          );
        });

        it('should paginate the sorted entries', async () => {
          const sorted = { sort: { prop: 'username' as const, asc: true }, actions: ['PUT'] };

          expect(await list({ ...sorted, page: 1, limit: 2 })).toMatchObject({
            rows: [{ time: T.entitiesPut }, { time: T.entitiesHelloPut }],
            remainingRows: 1,
          });
          expect(await list({ ...sorted, page: 2, limit: 2 })).toMatchObject({
            rows: [{ time: T.templatesPut }],
            remainingRows: 0,
          });
          expect(await list({ ...sorted, page: 3, limit: 2 })).toMatchObject({
            rows: [],
            remainingRows: 0,
          });
        });
      });
    });
  });
});
