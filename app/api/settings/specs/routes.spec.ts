import request from 'supertest';
import { NextFunction, Application } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import db from 'api/utils/testing_db';

import settingsRoutes from '../routes';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('Settings routes', () => {
  const app: Application = setUpApp(settingsRoutes);

  beforeEach(async () => {
    await db.clearAllAndLoad({
      settings: [
        {
          site_name: 'test',
          languages: [
            {
              key: 'en',
              default: true,
            },
          ],
        },
      ],
    });
  });

  afterAll(async () => db.disconnect());

  describe('GET', () => {
    it('should respond with settings', async () => {
      const response = await request(app).get('/api/settings');
      expect(response.body).toEqual(expect.objectContaining({ site_name: 'test' }));
    });
  });

  describe('POST', () => {
    it('should save settings', async () => {
      const response = await request(app)
        .post('/api/settings')
        .send({ site_name: 'my new name' });

      expect(response.body).toEqual(expect.objectContaining({ site_name: 'my new name' }));
    });
  });
});
