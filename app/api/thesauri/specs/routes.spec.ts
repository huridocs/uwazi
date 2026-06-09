/* eslint-disable max-statements */
import request from 'supertest';
import type { Application, Request, Response, NextFunction } from 'express';

import { search } from '#api/search/index.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import db from '#api/utils/testing_db.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { routes } from '../routes.js';
import thesauri from '../thesauri.js';
import { fixtures, dictionaryId } from './fixtures.js';
import { UserRole } from '#shared/types/userSchema.js';
import { DeleteThesaurusUseCaseFactory } from '#api/core/infrastructure/factories/DeleteThesaurusUseCaseFactory.js';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

jest.mock('../../core/infrastructure/factories/DeleteThesaurusUseCaseFactory.ts', () => ({
  DeleteThesaurusUseCaseFactory: {
    default: jest.fn(),
  },
}));

describe('thesauri routes', () => {
  const user = {
    _id: db.id(),
    role: UserRole.COLLABORATOR,
    username: 'user',
    email: 'user@test.com',
  };
  const app: Application = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = user;
    next();
  });

  beforeEach(async () => {
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET', () => {
    describe('/api/thesauris', () => {
      it('should return all thesauri by default, passing user', async () => {
        jest.spyOn(thesauri, 'get').mockResolvedValue('response' as any);
        const res = await request(app).get('/api/thesauris').set('content-language', 'es');
        expect(thesauri.get).toHaveBeenCalledWith(undefined, 'es', user);
        expect(res.body).toEqual({ rows: 'response' });
      });

      describe('when passing id', () => {
        it('should get passing id', async () => {
          jest.spyOn(thesauri, 'get').mockResolvedValue('response' as any);
          const res = await request(app).get('/api/thesauris').query({ _id: 'id' });
          expect(thesauri.get).toHaveBeenCalledWith('id', expect.any(String), user);
          expect(res.body).toEqual({ rows: 'response' });
        });
      });
    });

    describe('/api/dictionaries', () => {
      it('should return all dictionaries by default', async () => {
        const res = await request(app).get('/api/dictionaries');
        expect(res.body.rows).toHaveLength(4);
        expect(res.body.rows.map((r: any) => r.name)).toEqual(
          expect.arrayContaining(['dictionary', 'dictionary 2', 'Top 2 scify books', 'Top movies'])
        );
      });

      describe('when passing id', () => {
        it('should get matching id', async () => {
          const res = await request(app).get('/api/dictionaries').query({ _id: dictionaryId });
          expect(res.body.rows).toHaveLength(1);
          expect(res.body.rows[0].name).toBe('dictionary 2');
        });
      });
    });
  });

  describe('DELETE', () => {
    it('should delete a thesauri', async () => {
      const mockDeleteExecute = jest.fn().mockResolvedValue(undefined);
      (DeleteThesaurusUseCaseFactory.default as jest.Mock).mockReturnValue({
        execute: mockDeleteExecute,
      });

      await request(app).delete('/api/thesauris').query({ _id: 'abc' }).expect(200);

      expect(mockDeleteExecute).toHaveBeenCalledWith({ thesaurusId: 'abc' });
    });
  });

  describe('POST', () => {
    it('should create a thesauri', async () => {
      const res = await request(app)
        .post('/api/thesauris')
        .send({ name: 'Batman wish list', values: [{ label: 'Joker BFF' }] })
        .expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          name: 'Batman wish list',
          values: [{ label: 'Joker BFF', id: expect.any(String) }],
        })
      );
    });
  });
});
