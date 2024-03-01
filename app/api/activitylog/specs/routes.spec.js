import { setUpApp } from 'api/utils/testingRoutes';
import request from 'supertest';
import qs from 'qs';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { UserRole } from 'shared/types/userSchema';
import activitylogRoutes from '../routes.js';
import activitylog from '../activitylog';

jest.mock('../../utils/languageMiddleware.ts', () => (_req, _res, next) => {
  next();
});

describe('Activitylog routes', () => {
  let currentUser;

  const adminUser = {
    username: 'User 1',
    role: UserRole.ADMIN,
    email: 'user@test.com',
  };

  function getUser() {
    return currentUser;
  }

  const app = setUpApp(activitylogRoutes, (req, _res, next) => {
    req.user = getUser();
    next();
  });

  beforeAll(async () => {
    await testingEnvironment.setTenant();
    testingEnvironment.setRequestId();
    testingEnvironment.setPermissions({
      _id: 'userId',
      role: 'admin',
      username: 'adminUser',
      email: 'admin@test.com',
    });
  });

  beforeEach(async () => {
    jest.spyOn(activitylog, 'get').mockImplementation(async () => Promise.resolve('activitylogs'));
    activitylog.get.mockClear();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('GET', () => {
    it('should return the log with passed query', async () => {
      currentUser = adminUser;
      const response = await request(app)
        .get('/api/activitylog')
        .query(qs.stringify({ method: ['POST'], before: 1628256165 }));

      expect(activitylog.get).toHaveBeenCalledWith({
        before: 1628256165,
        method: ['POST'],
      });

      expect(response.body).toBe('activitylogs');
    });

    it('should not attempt to parse undefined method and time', async () => {
      currentUser = adminUser;
      await request(app).get('/api/activitylog').query({});
      expect(activitylog.get).toHaveBeenCalledWith({ method: undefined, time: undefined });
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
      };

      it('should allow a valid query', async () => {
        currentUser = adminUser;
        const response = await request(app).get('/api/activitylog').query(qs.stringify(validQuery));
        expect(response.status).toBe(200);
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
      ])(
        'should return a validation error for $case',
        async ({ changedProperty, expectedError, expectedPath }) => {
          currentUser = adminUser;
          const input = { ...validQuery, ...changedProperty };
          const response = await request(app).get('/api/activitylog').query(qs.stringify(input));
          expect(response.status).toBe(400);
          expect(activitylog.get).not.toHaveBeenCalled();
          expect(response.body.errors[0].keyword).toBe(expectedError);
          expect(response.body.errors[0].instancePath).toBe(expectedPath);
          expect(response.body.error).toBe('validation failed');
        }
      );
    });
  });
});
