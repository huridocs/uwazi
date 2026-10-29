import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { ObjectId } from 'mongodb';

import { TestUtils } from '#api/common.v2/utils/Test.js';
import { TranslationsService } from '#api/core/application/translation/TranslationsService.js';
import { TranslationsServiceFactory } from '#api/core/infrastructure/factories/TranslationsServiceFactory.js';
import { search } from '#api/search/index.js';
import { getSharedConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import * as setupSockets from '#api/socketio/setupSockets.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { settingsRoutes } from '../routes.js';
import fixtures from '../../../../application/settings/specs/fixtures.js';
import {
  clearJobs,
  ensureBroadcastSettingsChangedRegistered,
  expectSettingsChangedJob,
} from '../../../../application/settings/specs/settingsChangedJob.js';

jest.mock(
  '#api/auth/authMiddleware.js',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

jest.spyOn(setupSockets, 'emitToTenant').mockImplementation();

const testConfigs = [
  { name: 'Mongo', postgresCore: false },
  { name: 'Postgres', postgresCore: true },
];

describe('Settings routes', () => {
  const getApp = (userRole?: string) =>
    setUpApp(settingsRoutes, (req: Request, _res: Response, next: NextFunction) => {
      if (typeof userRole === 'string') {
        (req as any).user = { _id: new ObjectId().toString(), role: userRole, username: 'user' };
      }
      next();
    });

  beforeAll(async () => {
    jest.spyOn(search, 'indexEntities').mockResolvedValue();
    jest.spyOn(TranslationsServiceFactory, 'default').mockReturnValue(
      TestUtils.mockClass<TranslationsService>({
        updateContext: jest.fn().mockResolvedValue(undefined),
      })
    );
    await testingEnvironment.setUp(fixtures, {
      elasticIndex: 'settings_index',
      postgres: true,
      postgresMirror: [],
    });
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    beforeEach(async () => {
      await testingEnvironment.setUp(fixtures, {
        elasticIndex: 'settings_index',
        postgres: true,
        postgresMirror: postgresCore ? ['settings', 'templates'] : [],
      });
      if (postgresCore) {
        testingTenants.changeCurrentTenant({
          ...testingTenants.current(),
          featureFlags: { postgresCore: true },
        });
      }
      ensureBroadcastSettingsChangedRegistered();
    });

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
            site_logo: 'http://localhost:3000/assets/test-logo.png',
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
            site_logo: 'http://localhost:3000/assets/test-logo.png',
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
      const app = getApp('admin');

      it('should save settings', async () => {
        const response = await request(app)
          .post('/api/settings')
          .send({
            site_name: 'my new name',
            mailerConfig: 'smtp://user:password@example.com',
            contactEmail: 'contact@example.com',
            senderEmail: 'sender@example.com',
            features: { favorites: true },
          })
          .expect(200);

        expect(response.body).toEqual(
          expect.objectContaining({
            site_name: 'my new name',
            mailerConfig: 'smtp://user:password@example.com',
            features: { favorites: true },
          })
        );
      });

      it('should enqueue BroadcastSettingsChanged after save', async () => {
        await clearJobs(getSharedConnection());

        await request(app)
          .post('/api/settings')
          .send({ site_name: 'broadcasted name' })
          .expect(200);

        await expectSettingsChangedJob({ postgresCore, db: getSharedConnection() });
      });
    });
  });
});
