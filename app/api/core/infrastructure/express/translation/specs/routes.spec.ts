import 'isomorphic-fetch';
import type { Request } from 'express';
import request from 'supertest';

import { TranslationDBO } from '#api/core/infrastructure/mongodb/translation/schemas/TranslationDBO.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { TestEmitSources, iosocket, setUpApp } from '#api/utils/testingRoutes.js';
import { UserRole } from '#shared/types/userSchema.js';
import { translationsRoutes } from '../routes.js';

type UploadedFileRequest = Request & { file?: Express.Multer.File };

const testConfigs = [
  { name: 'Mongo', postgresTranslations: false },
  { name: 'Postgres', postgresTranslations: true },
];

const createTranslationDBO = getFixturesFactory().v2.database.translationDBO;

const createFixtures = (): DBFixture => {
  const translationsV2: TranslationDBO[] = [
    createTranslationDBO('Search', 'Buscar', 'es', {
      id: 'System',
      type: 'Entity',
      label: 'User Interface',
    }),
    createTranslationDBO('Search', 'Search', 'en', {
      id: 'System',
      type: 'Uwazi UI',
      label: 'User Interface',
    }),
  ];
  return {
    settings: [
      {
        languages: [
          { key: 'en', label: 'English', default: true },
          { key: 'es', label: 'Spanish', default: false },
        ],
      },
    ],
    translationsV2,
  };
};

describe('core translations by-item routes', () => {
  const app = setUpApp(translationsRoutes, (req: UploadedFileRequest, _res, next) => {
    req.user = {
      _id: 'admin',
      username: 'admin',
      role: UserRole.ADMIN,
      email: 'admin@test.com',
    };
    req.file = { path: 'filder/filename.ext' } as Express.Multer.File;
    next();
  });

  beforeAll(async () => {
    await testingEnvironment.setUp(createFixtures(), {
      elasticIndex: 'index_core_translation_v2_routes',
      postgres: true,
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresTranslations }) => {
    const applyBackendTenant = () => {
      testingTenants.changeCurrentTenant({
        featureFlags: postgresTranslations ? { postgresTranslations: true } : {},
      });
    };

    beforeEach(async () => {
      await testingEnvironment.setFixtures(createFixtures());
      applyBackendTenant();
      iosocket.emit.mockReset();
    });

    describe('/api/v2/translations', () => {
      it('should update the translations and emit translationKeysChange event', async () => {
        const response = await request(app)
          .post('/api/v2/translations')
          .send([
            {
              language: 'es',
              key: 'Search',
              value: 'Búsqueda',
              context: {
                id: 'System',
                label: 'User Interface',
                type: 'Uwazi UI',
              },
            },
          ]);
        expect(response.status).toEqual(200);
        expect(iosocket.emit).toHaveBeenCalledWith(
          'translationKeysChange',
          TestEmitSources.currentTenant,
          [
            {
              context: { id: 'System', label: 'User Interface', type: 'Uwazi UI' },
              key: 'Search',
              language: 'es',
              value: 'Búsqueda',
            },
          ]
        );
      });

      it('should handle invalid POST request payload', async () => {
        const response = await request(app)
          .post('/api/v2/translations')
          .send({ invalidKey: 'value' });
        expect(response.status).toBe(400);
        expect(response.body).toEqual(
          expect.objectContaining({ prettyMessage: 'validation failed' })
        );
      });
    });
  });
});
