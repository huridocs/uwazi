import { EventEmitter } from 'events';
// eslint-disable-next-line no-restricted-imports
import fs from 'fs/promises';
import type { NextFunction, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import waitForExpect from 'wait-for-expect';
import { legacyLogger } from '#api/log/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { ActivityLogMiddleware } from '../ActivityLogMiddleware.js';

const USER_ID = '5d9f1a2b3c4d5e6f7a8b9c0d';

const request = (overrides: object = {}) =>
  ({
    method: 'POST',
    url: '/api/entities',
    query: { a: 'query' },
    body: { title: 'Hi', password: '12345' },
    user: { _id: new ObjectId(USER_ID), username: 'admin' },
    params: { some: 'params' },
    ...overrides,
  }) as unknown as Request;

const response = (statusCode = 200) =>
  Object.assign(new EventEmitter(), { statusCode }) as unknown as Response;

const stored = async () => testingEnvironment.db.getAllFrom('activitylogs');

/** Long enough for a write the middleware started and did not wait for to land. */
const settle = async () =>
  new Promise(resolve => {
    setTimeout(resolve, 100);
  });

describe('ActivityLogMiddleware', () => {
  let next: jest.MockedFunction<NextFunction>;

  /** Runs the request through the middleware and answers it. */
  const answer = (req: Request, res = response()) => {
    ActivityLogMiddleware.handle(req, res, next);
    res.emit('finish');
  };

  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures({ activitylogs: [] });
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should log the request once it has been answered', async () => {
    answer(request());

    await waitForExpect(async () => {
      expect(await stored()).toMatchObject([
        {
          method: 'POST',
          url: '/api/entities',
          params: '{"some":"params"}',
          query: '{"a":"query"}',
          body: '{"title":"Hi","password":"*****"}',
          user: new ObjectId(USER_ID),
          username: 'admin',
        },
      ]);
    });
  });

  it('should let the request through without waiting for it to be logged', async () => {
    const res = response();

    ActivityLogMiddleware.handle(request(), res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    await settle();
    expect(await stored()).toEqual([]);
  });

  it('should log the path the request was made to, without its query string', async () => {
    answer(request({ method: 'DELETE', url: '/api/users?_id=user1' }));

    await waitForExpect(async () => {
      expect(await stored()).toMatchObject([{ method: 'DELETE', url: '/api/users' }]);
    });
  });

  it('should log a request made without a user', async () => {
    answer(request({ user: undefined }));

    await waitForExpect(async () => {
      expect(await stored()).toHaveLength(1);
    });
    expect((await stored())[0]).not.toHaveProperty('username');
  });

  it('should log a request without a body as an empty one', async () => {
    answer(request({ url: '/api/templates', body: undefined }));

    await waitForExpect(async () => {
      expect(await stored()).toMatchObject([{ url: '/api/templates', body: '{}' }]);
    });
  });

  it('should log a request once when it goes through the middleware twice', async () => {
    const req = request();
    const res = response();

    ActivityLogMiddleware.handle(req, res, next);
    ActivityLogMiddleware.handle(req, res, next);
    res.emit('finish');

    expect(next).toHaveBeenCalledTimes(2);
    await waitForExpect(async () => {
      expect(await stored()).toHaveLength(1);
    });
    await settle();
    expect(await stored()).toHaveLength(1);
  });

  it('should not write the entry to the tenant storage', async () => {
    answer(request());

    await waitForExpect(async () => {
      expect(await stored()).toHaveLength(1);
    });
    const tenant = testingTenants.current();
    const files = await fs.readdir(tenant.activityLogs).catch(() => []);
    expect(files.filter(name => name.startsWith(`${tenant.name}_`))).toEqual([]);
  });

  it('should report an entry that could not be stored, without failing the request', async () => {
    const logged = jest.spyOn(legacyLogger, 'error').mockImplementation(() => legacyLogger);

    answer(request({ user: { _id: 'not an id', username: 'admin' } }));

    await waitForExpect(() => {
      expect(logged).toHaveBeenCalled();
    });
    expect(next).toHaveBeenCalledWith();
    expect(await stored()).toEqual([]);
  });

  describe('requests that are not activity', () => {
    it.each([
      ['a read', request({ method: 'GET' }), 200],
      ['a request outside the API', request({ url: '/entities' }), 200],
      ['an ignored endpoint', request({ url: '/api/login' }), 200],
      ['an endpoint that does not exist', request(), 404],
    ])('should not log %s', async (_case, req, statusCode) => {
      answer(req, response(statusCode));

      await settle();
      expect(await stored()).toEqual([]);
    });
  });
});
