import { Application, NextFunction, Request, Response } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import statsRoutes from '../routes';
import request from 'supertest';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { fixtures } from './fixtures';
import { elastic } from 'api/search';
import testingDB from 'api/utils/testing_db';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('Stats routes', () => {
  const app: Application = setUpApp(statsRoutes);

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'stats');
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET /api/stats', () => {
    it('returns the aggregated stats', async () => {
      // @ts-ignore
      jest.spyOn(elastic.cat, 'indices').mockResolvedValue({ body: [{ 'store.size': 5000 }] });
      const { db } = await testingDB.connect();
      jest.spyOn(db, 'stats').mockResolvedValue({
        db: 'uwazi_testing',
        collections: 4,
        views: 0,
        objects: 16,
        avgObjSize: 134.6875,
        dataSize: 2155,
        storageSize: 15000,
        numExtents: 0,
        indexes: 4,
        indexSize: 15000,
        scaleFactor: 1,
        fsUsedSize: 28738330624,
        fsTotalSize: 62671097856,
        ok: 1,
      });

      const { body } = await request(app).get('/api/stats').expect(200);

      expect(body).toEqual({
        users: { total: 3, admin: 1, editor: 1, collaborator: 1 },
        entities: { total: 10 },
        files: { total: 2 },
        storage: { total: 30000 },
      });
    });
  });
});
