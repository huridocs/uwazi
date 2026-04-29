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
    describe('non-admin users', () => {
      it.each([
        ['unauthenticated', undefined],
        ['editor', 'editor'],
        ['collaborator', 'collaborator'],
      ])('should return only whitelisted public fields for %s users', async (_label, role) => {
        const response = await request(getApp(role)).get('/api/settings').expect(200);

        expect(response.body).toMatchObject({
          site_name: 'Uwazi',
          mapApiKey: 'testMapApiKey123',
          allowedPublicTemplates: ['id1', 'id2'],
        });

        expect(response.body.mailerConfig).toBeUndefined();
        expect(response.body.contactEmail).toBeUndefined();
        expect(response.body.senderEmail).toBeUndefined();
        expect(response.body.publicFormDestination).toBeUndefined();
        expect(response.body.features).toBeUndefined();
        expect(response.body.openPublicEndpoint).toBeUndefined();
      });
    });

    describe('admin users', () => {
      it('should return all settings including sensitive fields', async () => {
        const response = await request(getApp('admin')).get('/api/settings').expect(200);

        expect(response.body).toMatchObject({
          site_name: 'Uwazi',
          mailerConfig: 'smtp://user:password@smtp.example.com',
          contactEmail: 'admin@uwazi.com',
          senderEmail: 'noreply@uwazi.com',
          publicFormDestination: 'http://example.com/submit',
          features: expect.objectContaining({
            'metadata-extraction': true,
            metadataExtraction: { url: 'http:someurl' },
            segmentation: { url: 'http://otherurl' },
          }),
        });
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

      xit('should migrate all entity names when newNameGeneration is saved as true', async () => {
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
