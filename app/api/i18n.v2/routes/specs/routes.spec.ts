import 'isomorphic-fetch';
import request from 'supertest';

import { TranslationDBO } from 'api/i18n.v2/schemas/TranslationDBO';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { TestEmitSources, iosocket, setUpApp } from 'api/utils/testingRoutes';
import { UserRole } from 'shared/types/userSchema';
import { translationsRoutes } from '..';

describe('i18n translations V2 routes', () => {
  const createTranslationDBO = getFixturesFactory().v2.database.translationDBO;
  const app = setUpApp(translationsRoutes, (req, _res, next) => {
    req.user = {
      username: 'admin',
      role: UserRole.ADMIN,
      email: 'admin@test.com',
    };
    // @ts-ignore
    req.file = { path: 'filder/filename.ext' };
    next();
  });

  beforeEach(async () => {
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
    await testingEnvironment.setUp(
      {
        settings: [
          {
            languages: [
              { key: 'en', label: 'English', default: true },
              { key: 'es', label: 'Spanish', default: false },
            ],
          },
        ],
        translationsV2,
      },
      'index_i18n_v2_routes'
    );
  });

  afterEach(() => {
    iosocket.emit.mockReset();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
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
        .send({ invalidKey: 'value' }); // Invalid payload
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ prettyMessage: 'validation failed' })
      );
    });
  });
});
