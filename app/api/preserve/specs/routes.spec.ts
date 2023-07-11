import request from 'supertest';
import { Application } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import requestShared from 'shared/JSONRequest';
import { PreserveRoutes } from '../routes';

import fixtures, { userId1, userId2 } from './fixtures';

describe('entities get searchString', () => {
  const user = { _id: userId2 };
  const app: Application = setUpApp(PreserveRoutes, (req, _res, next) => {
    req.user = user;
    next();
  });

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'preserve-index-routes');
    jest.spyOn(requestShared, 'post').mockImplementation(async () =>
      Promise.resolve({
        json: { data: { token: 'sometoken' } },
        status: 200,
        headers: new Headers(),
        cookie: 'cooke',
        endpoint: { url: 'fake url', method: 'GET' },
      })
    );
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET', () => {
    it('should request a token and return config if existing', async () => {
      const { body } = await request(app).post('/api/preserve');

      expect(body.token).toBe('sometoken');
      expect(body.user).toBe(userId2.toString());
    });

    it('should request a token and config if config does not exist', async () => {
      user._id = userId1;
      const { body } = await request(app).post('/api/preserve');

      expect(body.token).toBe('sometoken');
      expect(body.user).toBe(userId1.toString());
    });
  });
});
