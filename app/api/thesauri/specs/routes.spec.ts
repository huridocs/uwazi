import path from 'path';
import request from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

// @ts-expect-error TS(2307): Cannot find module '../search.js' or its correspon... Remove this comment to see the full error message
import { search } from '../search.js';
// @ts-expect-error TS(2307): Cannot find module '../utils/testingRoutes.js' or ... Remove this comment to see the full error message
import { setUpApp } from '../utils/testingRoutes.js';

// @ts-expect-error TS(2307): Cannot find module '../../shared/tsUtils.js' or it... Remove this comment to see the full error message
import { ensure } from 'shared/tsUtils.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/thesaurusTy... Remove this comment to see the full error message
import { ThesaurusSchema } from 'shared/types/thesaurusType.js';

import { testingEnvironment } from 'api/utils/testingEnvironment.js';
import { routes } from '../routes.js';
import { thesauri } from '../thesauri.js';
import { fixtures } from './fixtures.js';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('Thesauri routes', () => {
  const app: Application = setUpApp(routes);

  beforeEach(async () => {
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('when file is uploaded', () => {
    it('should import data into the thesauri', async () => {
      const response = await request(app)
        .post('/api/thesauris')
        .field('thesauri', JSON.stringify({ name: 'Imported', values: [{ label: 'one' }] }))
        .attach('file', path.join(__dirname, '/uploads/import_thesauri.csv'))
        .expect(200);

      const { values = [] } = ensure<ThesaurusSchema>(await thesauri.getById(response.body._id));

      expect(values.length).toBe(3);
      // @ts-expect-error TS(7006): Parameter 'v' implicitly has an 'any' type.
      expect(values.some(v => v.label === 'one')).toBe(true);
      // @ts-expect-error TS(7006): Parameter 'v' implicitly has an 'any' type.
      expect(values.some(v => v.label === 'Value 1')).toBe(true);
      // @ts-expect-error TS(7006): Parameter 'v' implicitly has an 'any' type.
      expect(values.some(v => v.label === 'Value 2')).toBe(true);
    });
  });

  describe('/api/thesauri', () => {
    it('should call thesauri.find with correct params', async () => {
      jest.spyOn(thesauri, 'find').mockImplementation(async () => Promise.resolve({ rows: [] }));

      await request(app).get('/api/thesauri').expect(200);
      expect(thesauri.find).toHaveBeenNthCalledWith(1, undefined);

      await request(app).get('/api/thesauri?_id=any_id').expect(200);
      expect(thesauri.find).toHaveBeenNthCalledWith(2, { _id: 'any_id' });
    });
  });
});
