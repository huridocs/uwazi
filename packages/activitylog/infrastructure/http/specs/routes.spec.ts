import type { Application, NextFunction, Request, Response } from 'express';
import qs from 'qs';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import {
  listFixtures,
  NEWEST_FIRST,
  T,
} from '../../../application/specs/ActivityLogContractFixtures.js';
import { ActivityLogRoutes } from '../ActivityLogRoutes.js';

const admin = { _id: '5d9f1a2b3c4d5e6f7a8b9c0d', username: 'admin', role: 'admin' };
const editor = { _id: '5d9f1a2b3c4d5e6f7a8b9c0e', username: 'editor', role: 'editor' };

describe('activity log routes', () => {
  let user: object | undefined = admin;

  const app: Application = setUpApp(
    ActivityLogRoutes.register,
    (req: Request, _res: Response, next: NextFunction) => {
      Object.assign(req, { user });
      next();
    }
  );

  const get = async (query: object = {}) =>
    request(app).get('/api/activitylog').query(qs.stringify(query));

  const times = (response: request.Response) =>
    response.body.rows.map((row: { time: number }) => row.time);

  beforeAll(async () => {
    await testingEnvironment.setUp({
      ...listFixtures,
      settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
    });
  });

  beforeEach(() => {
    user = admin;
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('GET /api/activitylog', () => {
    it('should return the first page of the log, newest first', async () => {
      const response = await get();

      expect(response.status).toBe(200);
      expect(times(response)).toEqual(NEWEST_FIRST);
      expect(response.body).toMatchObject({ totalRows: 6, remainingRows: 0, limit: 15 });
      expect(response.body).not.toHaveProperty('page');
    });

    it('should return each entry as the screen reads it', async () => {
      const response = await get({ url: '/api/entities', username: 'admin', method: ['DELETE'] });

      expect(response.body.rows).toEqual([
        {
          _id: expect.stringMatching(/^[0-9a-f]{24}$/),
          method: 'DELETE',
          url: '/api/entities',
          query: '{"sharedId":"123"}',
          body: '{}',
          username: 'admin',
          time: T.entitiesDelete,
          semantic: { action: 'DELETE', description: 'Deleted entity', name: '123' },
        },
      ]);
    });

    it('should leave out the username of an entry made without a user', async () => {
      const response = await get({ url: '/api/entities/Hello' });

      expect(response.body.rows).toHaveLength(1);
      expect(response.body.rows[0]).not.toHaveProperty('username');
      expect(response.body.rows[0]).not.toHaveProperty('user');
    });

    it('should filter, sort and paginate by the query it is given', async () => {
      const response = await get({
        method: ['PUT'],
        sort: JSON.stringify({ prop: 'username', asc: 1 }),
        page: 2,
        limit: 2,
      });

      expect(times(response)).toEqual([T.templatesPut]);
      expect(response.body).toMatchObject({ totalRows: 3, remainingRows: 0, limit: 2, page: 2 });
    });

    it('should load the entries before a given time', async () => {
      const response = await get({ before: T.entitiesHelloPut, limit: 2 });

      expect(times(response)).toEqual([T.entitiesCreate, T.entitiesDelete]);
      expect(response.body.remainingRows).toBe(1);
    });

    it('should filter by a time range', async () => {
      const response = await get({
        time: JSON.stringify({ from: T.entitiesCreate, to: T.entitiesHelloPut }),
      });

      expect(times(response)).toEqual([T.entitiesHelloPut, T.entitiesCreate]);
    });

    it.each([
      ['an editor', editor],
      ['nobody', undefined],
    ])('should refuse %s', async (_who, requester) => {
      user = requester;

      expect((await get()).status).toBe(401);
    });

    describe('validation', () => {
      const validQuery = {
        username: 'collaborator',
        find: 'textToFind',
        before: 1627924445000,
        limit: 3,
        page: 1,
        method: ['POST'],
        search: 'no value',
        sort: JSON.stringify({ prop: 'username', asc: 1 }),
        time: JSON.stringify({ from: 1627924445000, to: 1627924445000 }),
      };

      it('should allow a valid query', async () => {
        expect((await get(validQuery)).status).toBe(200);
      });

      it.each([1, 500])('should allow a limit of %s', async limit => {
        expect((await get({ limit })).status).toBe(200);
      });

      it.each([
        {
          changedProperty: { additional: 'abc' },
          expectedError: 'additionalProperties',
          expectedPath: '/query',
          case: 'an additional property',
        },
        {
          changedProperty: { limit: 'abc' },
          expectedError: 'type',
          expectedPath: '/query/limit',
          case: 'a limit type error',
        },
        {
          changedProperty: { limit: 0 },
          expectedError: 'minimum',
          expectedPath: '/query/limit',
          case: 'a limit of zero',
        },
        {
          changedProperty: { limit: -5 },
          expectedError: 'minimum',
          expectedPath: '/query/limit',
          case: 'a negative limit',
        },
        {
          changedProperty: { limit: 501 },
          expectedError: 'maximum',
          expectedPath: '/query/limit',
          case: 'a limit over 500',
        },
        {
          changedProperty: { before: 'abc' },
          expectedError: 'type',
          expectedPath: '/query/before',
          case: 'a before type error',
        },
        {
          changedProperty: { page: 0 },
          expectedError: 'minimum',
          expectedPath: '/query/page',
          case: 'a page minimum error',
        },
        {
          changedProperty: { sort: JSON.stringify({ prop: 'username', asc: -1 }) },
          expectedError: 'minimum',
          expectedPath: '/query/sort/asc',
          case: 'a sort.asc value error',
        },
        {
          changedProperty: { sort: JSON.stringify({ prop: 'invalid_prop', asc: 1 }) },
          expectedError: 'enum',
          expectedPath: '/query/sort/prop',
          case: 'a sort.prop value error',
        },
      ])(
        'should return a validation error for $case',
        async ({ changedProperty, expectedError, expectedPath }) => {
          const response = await get({ ...validQuery, ...changedProperty });

          expect(response.status).toBe(400);
          expect(response.body.errors[0].keyword).toBe(expectedError);
          expect(response.body.errors[0].instancePath).toBe(expectedPath);
          expect(response.body.error).toBe('validation failed');
        }
      );
    });
  });
});
