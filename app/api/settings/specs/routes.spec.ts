import entities from '#api/entities/index.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { search } from '#api/search/index.js';
import settings from '#api/settings/index.js';
import templates from '#api/core/v1_layer/templates/index.js';
import users from '#api/users/users.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';

import translations from '#api/i18n/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import waitForExpect from 'wait-for-expect';
import * as setupSockets from '#api/socketio/setupSockets.js';
import settingsRoutes from '../routes.js';
import { settingsModel } from '../settingsModel.js';
import fixtures from './fixtures.js';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

jest.spyOn(setupSockets, 'emitToTenant').mockImplementation();

describe('Settings routes', () => {
  const getApp = (userRole?: string) =>
    setUpApp(settingsRoutes, (req: Request, _res: Response, next: NextFunction) => {
      if (typeof userRole === 'string') {
        (req as any).user = { role: userRole };
      }
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
    describe('unauthenticated users', () => {
      it('should return only whitelisted public fields', async () => {
        const response = await request(getApp()).get('/api/settings').expect(200);

        expect(response.body).toEqual(expect.objectContaining({ site_name: 'Uwazi' }));
        expect(response.body.mapApiKey).toBe('testMapApiKey123');
        expect(response.body.allowedPublicTemplates).toEqual(['id1', 'id2']);

        expect(response.body.mailerConfig).toBeUndefined();
        expect(response.body.contactEmail).toBeUndefined();
        expect(response.body.senderEmail).toBeUndefined();
        expect(response.body.features).toBeUndefined();
      });
    });

    describe('authenticated non-admin/editor users', () => {
      it('should return all fields except features', async () => {
        const response = await request(getApp('collaborator')).get('/api/settings').expect(200);

        expect(response.body).toEqual(expect.objectContaining({ site_name: 'Uwazi' }));
        expect(response.body.mailerConfig).toBe('smtp://user:password@smtp.example.com');
        expect(response.body.contactEmail).toBe('admin@uwazi.com');
        expect(response.body.senderEmail).toBe('noreply@uwazi.com');
        expect(response.body.features).toBeUndefined();
      });
    });

    describe('admins and editors', () => {
      it('should return all settings including features', async () => {
        const [adminResponse, editorResponse] = await Promise.all([
          request(getApp('admin')).get('/api/settings').expect(200),
          request(getApp('editor')).get('/api/settings').expect(200),
        ]);

        const expectedFeatures = {
          'metadata-extraction': true,
          metadataExtraction: {
            url: 'http:someurl',
          },
          segmentation: {
            url: 'http://otherurl',
          },
        };

        // Admins should see all fields including features
        expect(adminResponse.body.features).toEqual(expect.objectContaining(expectedFeatures));
        expect(adminResponse.body.mailerConfig).toBe('smtp://user:password@smtp.example.com');
        expect(adminResponse.body.contactEmail).toBe('admin@uwazi.com');
        expect(adminResponse.body.senderEmail).toBe('noreply@uwazi.com');

        // Editors should also see all fields including features
        expect(editorResponse.body.features).toEqual(expect.objectContaining(expectedFeatures));
        expect(editorResponse.body.mailerConfig).toBe('smtp://user:password@smtp.example.com');
      });
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
        jest.spyOn(users, 'getById').mockReturnValue({
          //@ts-ignore
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

        await waitForExpect(async () => {
          expect(await entities.get()).toEqual([
            expect.objectContaining({ language: 'en', metadata: { براي: [{ value: 'value' }] } }),
            expect.objectContaining({ language: 'es', metadata: { براي: [{ value: 'value' }] } }),
            expect.objectContaining({ language: 'en', metadata: { país: [{ value: 'pais' }] } }),
            expect.objectContaining({ language: 'es', metadata: { país: [{ value: 'pais' }] } }),
          ]);
        });
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
