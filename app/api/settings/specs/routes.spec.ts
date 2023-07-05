import entities from 'api/entities';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { search } from 'api/search';
import settings from 'api/settings';
import templates from 'api/templates';
import { setUpApp } from 'api/utils/testingRoutes';
import { Application, NextFunction } from 'express';
import request from 'supertest';

import translations from 'api/i18n';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import settingsRoutes from '../routes';
import { settingsModel } from '../settingsModel';
import fixtures from './fixtures';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('Settings routes', () => {
  const app: Application = setUpApp(settingsRoutes);

  beforeAll(async () => {
    jest.spyOn(search, 'indexEntities').mockResolvedValue();
    jest.spyOn(translations, 'updateContext').mockImplementation(async () => 'ok');
    const elasticIndex = 'settings_index';
    await testingEnvironment.setUp(fixtures, elasticIndex);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET', () => {
    it('should respond with settings', async () => {
      const response = await request(app).get('/api/settings').expect(200);
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
      beforeEach(() => {
        jest.spyOn(permissionsContext, 'getUserInContext').mockReturnValue({
          _id: 'user1',
          username: 'User 1',
          email: 'user@test.test',
          role: 'admin',
        });
      });

      it('should migrate all entity names when newNameGeneration is saved as true', async () => {
        await request(app).post('/api/settings').send({ newNameGeneration: true }).expect(200);

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
        jest.spyOn(templates, 'save');
        await settingsModel.save({ ...(await settings.get()), newNameGeneration: true });

        await request(app).post('/api/settings').send({}).expect(200);

        await request(app).post('/api/settings').send({ newNameGeneration: true }).expect(200);

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
