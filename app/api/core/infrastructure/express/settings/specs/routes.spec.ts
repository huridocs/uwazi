import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { ObjectId } from 'mongodb';

import { TestUtils } from '#api/common.v2/utils/Test.js';
import { TranslationsService } from '#api/core/application/translation/TranslationsService.js';
import { TranslationsServiceFactory } from '#api/core/infrastructure/factories/TranslationsServiceFactory.js';
import templates from '#api/core/v1_layer/templates/index.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { search } from '#api/search/index.js';
import { UsersDirectoryFactory } from '#api/core/infrastructure/factories/UsersDirectoryFactory.js';
import { getSharedConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { Result } from '#api/core/libs/Result.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import * as setupSockets from '#api/socketio/setupSockets.js';
import { testingEnvironment, SettingsDSWithContext } from '#api/utils/testingEnvironment.js';
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
  { name: 'Mongo', postgresSettings: false },
  { name: 'Postgres', postgresSettings: true },
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
    });
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe.each(testConfigs)('$name', ({ postgresSettings }) => {
    beforeEach(async () => {
      await testingEnvironment.setUp(fixtures, {
        elasticIndex: 'settings_index',
        postgres: true,
        postgresMirror: postgresSettings ? ['settings'] : [],
      });
      if (postgresSettings) {
        testingTenants.changeCurrentTenant({
          ...testingTenants.current(),
          featureFlags: { postgresSettings: true },
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

        await expectSettingsChangedJob(getSharedConnection());
      });

      describe('newNameGeneration', () => {
        beforeEach(() => {
          jest.spyOn(permissionsContext, 'getUserInContext').mockReturnValue({
            _id: 'user1',
            username: 'User 1',
            email: 'user@test.test',
            role: 'admin',
          });
          const contextUser = {
            _id: 'user1',
            username: 'User 1',
            email: 'user@test.test',
            role: 'admin',
          };
          jest.spyOn(UsersDirectoryFactory, 'default').mockReturnValue({
            getById: async () => Result.ok(contextUser as any),
            getActor: async () => Result.ok(contextUser as any),
            getProfile: async () => Result.ok(contextUser as any),
            getManyByIds: async () => [contextUser as any],
          } as any);
        });

        it('should migrate all entity names when newNameGeneration is saved as true', async () => {
          await request(app).post('/api/settings').send({ newNameGeneration: true }).expect(200);

          expect(await templates.get()).toEqual([
            expect.objectContaining({ properties: [expect.objectContaining({ name: 'براي' })] }),
            expect.objectContaining({ properties: [expect.objectContaining({ name: 'país' })] }),
          ]);
        });

        it('should only migrate in the newNameGeneration false to true scenario', async () => {
          jest.spyOn(templates, 'save');
          await SettingsDSWithContext.default().patch({ newNameGeneration: true });

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
            expect.objectContaining({ message: expect.stringMatching(/true/) }),
          ]);
        });
      });
    });
  });
});
