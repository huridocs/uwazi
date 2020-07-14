import request from 'supertest';
import { NextFunction, Application } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import db from 'api/utils/testing_db';
import entities from 'api/entities';
import settings from 'api/settings';
import templates from 'api/templates';
import { search } from 'api/search';

import fixtures from './fixtures';
import settingsRoutes from '../routes';
import { settingsModel } from '../settingsModel';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('Settings routes', () => {
  const app: Application = setUpApp(settingsRoutes);

  beforeEach(async () => {
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => db.disconnect());

  describe('GET', () => {
    it('should respond with settings', async () => {
      const response = await request(app)
        .get('/api/settings')
        .expect(200);
      expect(response.body).toEqual(expect.objectContaining({ site_name: 'Uwazi' }));
    });
  });

  describe('POST', () => {
    it('should save settings', async () => {
      const response = await request(app)
        .post('/api/settings')
        .send({ site_name: 'my new name' })
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({ site_name: 'my new name' }));
    });

    describe('newNameGeneration', () => {
      it('should migrate all entity names when newNameGeneration is saved as true', async () => {
        await request(app)
          .post('/api/settings')
          .send({ newNameGeneration: true })
          .expect(200);

        expect(await templates.get()).toEqual([
          expect.objectContaining({ properties: [expect.objectContaining({ name: 'براي' })] }),
          expect.objectContaining({ properties: [expect.objectContaining({ name: 'país' })] }),
        ]);

        expect(await entities.get()).toEqual([
          expect.objectContaining({ language: 'en', metadata: { براي: [{ value: 'value' }] } }),
          expect.objectContaining({ language: 'es', metadata: { براي: [{ value: 'value' }] } }),
          expect.objectContaining({ language: 'en', metadata: { país: [{ value: 'pais' }] } }),
          expect.objectContaining({ language: 'es', metadata: { país: [{ value: 'pais' }] } }),
        ]);
      });

      it('should only migrate in the newNameGeneration false to true scenario', async () => {
        spyOn(templates, 'save').and.returnValue(Promise.resolve());
        await settingsModel.save({ ...(await settings.get()), newNameGeneration: true });

        await request(app)
          .post('/api/settings')
          .send({})
          .expect(200);

        await request(app)
          .post('/api/settings')
          .send({ newNameGeneration: true })
          .expect(200);

        expect(templates.save).not.toHaveBeenCalled();
      });

      it('should not allow newNameGeneration === false', async () => {
        const response = await request(app)
          .post('/api/settings')
          .send({ newNameGeneration: false })
          .expect(422);

        expect(response.body.validations).toEqual([
          expect.objectContaining({ params: { allowedValues: [true] } }),
        ]);
      });
    });
  });
});
