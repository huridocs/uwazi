import { Application, Request, Response, NextFunction } from 'express';
import request from 'supertest';

import { setUpApp } from 'api/utils/testingRoutes';

import { testingEnvironment } from 'api/utils/testingEnvironment';
import routes from '../routes';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('relationships routes', () => {
  const app: Application = setUpApp(routes);

  beforeEach(async () => {
    await testingEnvironment.setUp({
      settings: [{ languages: [{ key: 'en', label: 'EN', default: true }] }],
    });
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('POST/bulk', () => {
    it('should validate connections', async () => {
      const { body } = await request(app)
        .post('/api/relationships/bulk')
        .send({ save: [{ notAllowedProperty: 'test' }], delete: [] });

      expect(body.prettyMessage).toBe('validation failed\n/0: must NOT have additional properties');
    });

    it('should throw an especial 500 error when selectionRectangles is sent empty', async () => {
      const { body, status } = await request(app)
        .post('/api/relationships/bulk')
        .send({ save: [{ reference: { text: 'test', selectionRectangles: [] } }], delete: [] });

      expect(status).toBe(500);
      expect(body.error.match(/selectionRectangles should not be empty/)).not.toBe(null);
    });
  });
});
