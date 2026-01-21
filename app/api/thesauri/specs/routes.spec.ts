/* eslint-disable max-statements */
import path from 'path';
import request from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import { search } from '#api/search/index.js';

import { setUpApp } from '#api/utils/testingRoutes.js';

import { ensure } from '#shared/tsUtils.js';

import { ThesaurusSchema } from '#shared/types/thesaurusType.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { routes } from '#api/thesauri/routes.js';
import { thesauri } from '#api/thesauri/thesauri.js';
import { fixtures } from '#api/thesauri/specs/fixtures.js';
import { tenants } from '#api/tenants/index.js';

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

  describe('POST /api/thesauri', () => {
    const controllerSpy = jest
      .spyOn(CreateThesaurusController, 'createHandler')
      //@ts-ignore
      .mockResolvedValue(undefined);
    const thesauriSaveSpy = jest.spyOn(thesauri, 'save');

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should only call CreateThesaurusController', async () => {
      jest
        .spyOn(tenants, 'current')
        .mockReturnValue({ featureFlags: { v2CreateThesaurus: true } } as any);

      await request(app)
        .post('/api/thesauris')
        .send({ name: 'New Thesaurus', values: [{ label: 'Value 1' }] });

      expect(controllerSpy).toHaveBeenCalled();
      expect(thesauriSaveSpy).not.toHaveBeenCalled();
    });

    it('should only call thesauri.save', async () => {
      jest
        .spyOn(tenants, 'current')
        .mockReturnValue({ featureFlags: { v2CreateThesaurus: false } } as any);

      await request(app)
        .post('/api/thesauris')
        .send({ name: 'New Thesaurus', values: [{ label: 'Value 1' }] });

      expect(thesauriSaveSpy).toHaveBeenCalled();
      expect(controllerSpy).not.toHaveBeenCalled();

      // V2 Create Thesaurus feature flag enabled
      jest
        .spyOn(tenants, 'current')
        .mockReturnValue({ featureFlags: { v2CreateThesaurus: true } } as any);

      // but a file is uploaded
      await request(app)
        .post('/api/thesauris')
        .field('thesauri', JSON.stringify({ name: 'Imported', values: [{ label: 'one' }] }))
        .attach('file', path.join(__dirname, '/uploads/import_thesauri.csv'));

      expect(thesauriSaveSpy).toHaveBeenCalled();
      expect(controllerSpy).not.toHaveBeenCalled();

      // V2 Create Thesaurus feature flag enabled
      jest
        .spyOn(tenants, 'current')
        .mockReturnValue({ featureFlags: { v2CreateThesaurus: true } } as any);

      // but its an update
      await request(app)
        .post('/api/thesauris')
        .send({
          _id: new ObjectId().toHexString(),
          name: 'New Thesaurus',
          values: [{ label: 'Value 1' }],
        });

      expect(thesauriSaveSpy).toHaveBeenCalled();
      expect(controllerSpy).not.toHaveBeenCalled();
    });
  });
});
