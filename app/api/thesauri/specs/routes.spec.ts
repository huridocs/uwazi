import path from 'path';
import request from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import { search } from 'api/search';
import db from 'api/utils/testing_db';
import errorLog from 'api/log/errorLog';
import { setupTestUploadedPaths } from 'api/files/filesystem';
import { setUpApp } from 'api/utils/testingRoutes';

import { routes } from '../routes';
import { thesauri } from '../thesauri';
import { fixtures } from './fixtures';
import { ensure } from 'shared/tsUtils';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('Thesauri routes', () => {
  const app: Application = setUpApp(routes);

  beforeEach(async () => {
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
    spyOn(Date, 'now').and.returnValue(1000);
    spyOn(errorLog, 'error'); //just to avoid annoying console output
    await db.clearAllAndLoad(fixtures);
    setupTestUploadedPaths();
  });

  afterAll(async () => db.disconnect());

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
});
