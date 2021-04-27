import { Application, Request, Response, NextFunction } from 'express';
import request from 'supertest';

import { testingDB } from 'api/utils/testing_db';
import { setUpApp } from 'api/utils/testingRoutes';

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
    await testingDB.clearAllAndLoad({
      settings: [{ languages: [{ key: 'en', default: true }] }],
    });
  });

  afterAll(async () => testingDB.disconnect());

  describe('POST/bulk', () => {
    it('should validate that selectionRectangles is not empty', async () => {
      const { body } = await request(app)
        .post('/api/relationships/bulk')
        .send({ save: [{ reference: { text: 'test', selectionRectangles: [] } }], delete: [] });

      expect(body.validations.find((e: Ajv.ErrorObject) => e.keyword === 'minItems')).toEqual(
        expect.objectContaining({
          dataPath: '[0].reference.selectionRectangles',
        })
      );
    });
  });
});
