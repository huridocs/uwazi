import { NextFunction, Request, Response } from 'express';
import entities from 'api/entities';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { search } from 'api/search';
import settings from 'api/settings';
import templates from 'api/templates';
import { setUpApp } from 'api/utils/testingRoutes';
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
  const getApp = (userRole?: string) =>
    setUpApp(settingsRoutes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = { role: userRole };
      next();
    });

  beforeAll(async () => {
    jest.spyOn(search, 'indexEntities').mockResolvedValue();
    jest.spyOn(translations, 'updateContext').mockImplementation(async () => 'ok');
    const elasticIndex = 'settings_index';
    await testingEnvironment.setUp(fixtures, elasticIndex);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET', () => {
    it('should respond with settings', async () => {
      const response = await request(getApp()).get('/api/settings').expect(200);
      expect(response.body).toEqual(expect.objectContaining({ site_name: 'Uwazi' }));
      expect(response.body.features).toBe(undefined);
    });

    it('should return the collection features for admins and editors', async () => {
      const [adminResponse, editorResponse] = await Promise.all([
        await request(getApp('admin')).get('/api/settings').expect(200),
        await request(getApp('editor')).get('/api/settings').expect(200),
      ]);

      const expectedResponse = {
        'metadata-extraction': true,
        metadataExtraction: {
          url: 'http:someurl',
        },
        segmentation: {
          url: 'http://otherurl',
        },
      };

      expect(adminResponse.body.features).toEqual(expect.objectContaining(expectedResponse));

      expect(editorResponse.body.features).toEqual(expect.objectContaining(expectedResponse));
    });
  });

  describe('POST', () => {
    const app = getApp();

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
