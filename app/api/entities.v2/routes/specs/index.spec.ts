import 'isomorphic-fetch';
import request from 'supertest';

import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import { UserRole } from 'shared/types/userSchema';
import { entitiesRoutes } from '..';

describe('entities countByTemplate V2 routes', () => {
  const factory = getFixturesFactory();
  const createTemplate = factory.template;
  const createEntity = factory.entity;

  const app = setUpApp(entitiesRoutes, (req, _res, next) => {
    req.user = {
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
          createEntity('Entity 1 EN', 'Template 1', {}, { language: 'en' }),
          createEntity('Entity 2 EN', 'Template 1', {}, { language: 'en' }),
          createEntity('Entity 3 EN', 'Template 1', {}, { language: 'en' }),
          createEntity('Entity 4 EN', 'Template 2', {}, { language: 'en' }),
          createEntity('Entity 5 EN', 'Template 2', {}, { language: 'en' }),
          createEntity('Entity 1 ES', 'Template 1', {}, { language: 'es' }),
          createEntity('Entity 2 ES', 'Template 1', {}, { language: 'es' }),
          createEntity('Entity 3 ES', 'Template 2', {}, { language: 'es' }),
          createEntity('Entity 1 FR', 'Template 1', {}, { language: 'fr' }),
        ],
      },
      'index_entities_v2_count_by_template'
    );
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('GET /api/v2/entities/count_by_template', () => {
    it('should return count of entities for a specific template in the request language', async () => {
      const response = await request(app)
        .get('/api/v2/entities/count_by_template')
        .query({ templateId: template1._id.toString() })
        .set('Accept-Language', 'en');

      expect(response.status).toBe(200);
      expect(response.body).toBe(3);
    });

    it('should return count of entities for a specific template in Spanish language', async () => {
      const response = await request(app)
        .get('/api/v2/entities/count_by_template')
        .query({ templateId: template1._id.toString() })
        .set('Accept-Language', 'es');

      expect(response.status).toBe(200);
      expect(response.body).toBe(2);
    });

    it('should return count of entities for a specific template in French language', async () => {
      const response = await request(app)
        .get('/api/v2/entities/count_by_template')
        .query({ templateId: template1._id.toString() })
        .set('Accept-Language', 'fr');

      expect(response.status).toBe(200);
      expect(response.body).toBe(1);
    });

    it('should return count of entities for template2 in English', async () => {
      const response = await request(app)
        .get('/api/v2/entities/count_by_template')
        .query({ templateId: template2._id.toString() })
        .set('Accept-Language', 'en');

      expect(response.status).toBe(200);
      expect(response.body).toBe(2);
    });

    it('should return count of entities for template2 in Spanish', async () => {
      const response = await request(app)
        .get('/api/v2/entities/count_by_template')
        .query({ templateId: template2._id.toString() })
        .set('Accept-Language', 'es');

      expect(response.status).toBe(200);
      expect(response.body).toBe(1);
    });

    it('should return 0 for template with no entities in the specified language', async () => {
      const response = await request(app)
        .get('/api/v2/entities/count_by_template')
        .query({ templateId: template2._id.toString() })
        .set('Accept-Language', 'fr');

      expect(response.status).toBe(200);
      expect(response.body).toBe(0);
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

    it('should use default language when Accept-Language header is not provided', async () => {
      const response = await request(app)
        .get('/api/v2/entities/count_by_template')
        .query({ templateId: template1._id.toString() });

      expect(response.status).toBe(200);
      expect(response.body).toBe(3);
    });
  });
});
