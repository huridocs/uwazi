import 'isomorphic-fetch';
import request from 'supertest';

import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { UserRole } from '#shared/types/userSchema.js';
import { entitiesRoutes } from '..';

describe('entities countByTemplate V2 routes', () => {
  const factory = getFixturesFactory();
  const createTemplate = factory.template;

  const app = setUpApp(entitiesRoutes, (req, _res, next) => {
    req.user = {
      _id: 'admin',
      username: 'admin',
      role: UserRole.ADMIN,
      email: 'admin@test.com',
    };
    next();
  });

  const template1 = createTemplate('Template 1');
  const template2 = createTemplate('Template 2');

  beforeEach(async () => {
    await testingEnvironment.setUp(
      {
        settings: [
          {
            languages: [
              { key: 'en', label: 'English', default: true },
              { key: 'es', label: 'Spanish', default: false },
              { key: 'fr', label: 'French', default: false },
            ],
          },
        ],
        templates: [template1, template2],
        entities: [
          ...factory.entityInMultipleLanguages(
            ['en', 'es', 'fr'],
            'entity_1',
            'Template 1',
            {},
            {}
          ),
          ...factory.entityInMultipleLanguages(
            ['en', 'es', 'fr'],
            'entity_2',
            'Template 1',
            {},
            {}
          ),
          ...factory.entityInMultipleLanguages(
            ['en', 'es', 'fr'],
            'entity_3',
            'Template 1',
            {},
            {}
          ),
          ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_4', 'Template 2', {}, {}),
          ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_5', 'Template 2', {}, {}),
        ],
      },
      'index_entities_v2_count_by_template'
    );
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('GET /api/v2/entities/count_by_template', () => {
    it('should return the unique entity count for a template across all languages', async () => {
      const response = await request(app)
        .get('/api/v2/entities/count_by_template')
        .query({ templateId: template1._id.toString() })
        .set('Accept-Language', 'en');

      expect(response.status).toBe(200);
      expect(response.body).toBe(3);
    });

    it('should return the unique entity count for template2 across all languages', async () => {
      const response = await request(app)
        .get('/api/v2/entities/count_by_template')
        .query({ templateId: template2._id.toString() })
        .set('Accept-Language', 'es');

      expect(response.status).toBe(200);
      expect(response.body).toBe(2);
    });

    it('should return 0 for non-existent template', async () => {
      const response = await request(app)
        .get('/api/v2/entities/count_by_template')
        .query({ templateId: '507f1f77bcf86cd799439011' })
        .set('Accept-Language', 'en');

      expect(response.status).toBe(200);
      expect(response.body).toBe(0);
    });

    it('should handle missing templateId parameter', async () => {
      const response = await request(app)
        .get('/api/v2/entities/count_by_template')
        .set('Accept-Language', 'en');

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ prettyMessage: 'validation failed' })
      );
    });

    it('should handle invalid templateId format', async () => {
      const response = await request(app)
        .get('/api/v2/entities/count_by_template')
        .query({ templateId: 'invalid-id' })
        .set('Accept-Language', 'en');

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ prettyMessage: 'validation failed' })
      );
    });

    it('should not depend on Accept-Language header', async () => {
      const response = await request(app)
        .get('/api/v2/entities/count_by_template')
        .query({ templateId: template1._id.toString() });

      expect(response.status).toBe(200);
      expect(response.body).toBe(3);
    });
  });
});
