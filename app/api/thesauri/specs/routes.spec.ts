import path from 'path';
import request from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import { search } from 'api/search';
import { setUpApp } from 'api/utils/testingRoutes';

import { ensure } from 'shared/tsUtils';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { routes } from '../routes';
import { thesauri } from '../thesauri';
import { fixtures } from './fixtures';

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
      expect(values.some(v => v.label === 'one')).toBe(true);
      expect(values.some(v => v.label === 'Value 1')).toBe(true);
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
