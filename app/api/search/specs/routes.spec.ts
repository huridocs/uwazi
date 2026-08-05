import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import type { Application } from 'express';
import request, { Response as SuperTestResponse } from 'supertest';

import searchRoutes from '#api/search/routes.js';
import deprecatedSearchRoutes from '#api/search/deprecatedRoutes.js';
import { setUpApp } from '#api/utils/testingRoutes.js';

import { UserRole } from '#shared/types/userSchema.js';
import { UserInContextMockFactory } from '../../utils/testingUserInContext.js';
import { fixtures, fixturesTimeOut, ids } from './fixtures_elastic.js';

describe('Search routes', () => {
  const app: Application = setUpApp(searchRoutes);
  const deprecatedApp: Application = setUpApp(deprecatedSearchRoutes);
  const elasticIndex = 'search_lookup_index_test';

  beforeAll(async () => {
    //@ts-ignore
    await testingEnvironment.setUp(fixtures, elasticIndex);
  }, fixturesTimeOut);

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET /api/search', () => {
    const sharedIds = (res: SuperTestResponse) =>
      res.body.rows.map((row: { sharedId: string }) => row.sharedId).sort();

    it('should normalize malformed select filter values from HTTP requests', async () => {
      const wellFormed = await request(deprecatedApp)
        .get('/api/search')
        .query({ filters: JSON.stringify({ groupedDictionary: { values: ['EuropeID'] } }) });
      const bareArray = await request(deprecatedApp)
        .get('/api/search')
        .query({ filters: JSON.stringify({ groupedDictionary: ['EuropeID'] }) });
      const bareScalar = await request(deprecatedApp)
        .get('/api/search')
        .query({ filters: JSON.stringify({ groupedDictionary: 'EuropeID' }) });

      expect(wellFormed.status).toBe(200);
      expect(bareArray.status).toBe(200);
      expect(bareScalar.status).toBe(200);
      expect(sharedIds(bareArray)).toEqual(sharedIds(wellFormed));
      expect(sharedIds(bareScalar)).toEqual(sharedIds(wellFormed));
    });
  });

  describe('GET /search/lookup', () => {
    it('should return a list of entity options', async () => {
      const res: SuperTestResponse = await request(app)
        .get('/api/search/lookup')
        .query({ searchTerm: 'bat' });

      expect(res.body.options.length).toBe(2);
      expect(res.body.options[0].label).toBeDefined();
      expect(res.body.options[0].template).toBeDefined();
      expect(res.body.options[0].value).toBeDefined();
      expect(res.body.options.find((o: any) => o.label.includes('finishes')).label).toBe(
        'Batman finishes en'
      );
      expect(res.body.options.find((o: any) => o.label.includes('begins')).label).toBe(
        'Batman begins en'
      );
      expect(res.body.count).toBe(2);
    });

    it('should filter by template', async () => {
      let res: SuperTestResponse = await request(app)
        .get('/api/search/lookup')
        .query({ searchTerm: 'en', templates: '[]' });
      expect(res.body.options.length).toBe(5);

      res = await request(app)
        .get('/api/search/lookup')
        .query({ searchTerm: 'en', templates: JSON.stringify([ids.template1]) });
      expect(res.body.options.length).toBe(3);
      expect(res.body.count).toBe(3);
    });

    it('should include unpublished entities', async () => {
      const res = await request(app)
        .get('/api/search/lookup')
        .set('content-language', 'es')
        .query({ searchTerm: 'unpublished' });
      expect(res.body.options.length).toBe(1);
    });

    it('should search by the parts of a word', async () => {
      let res = await request(app)
        .get('/api/search/lookup')
        .set('content-language', 'es')
        .query({ searchTerm: 'she' });
      expect(res.body.options.length).toBe(3);
      res = await request(app)
        .get('/api/search/lookup')
        .set('content-language', 'es')
        .query({ searchTerm: 'shed' });
      expect(res.body.options.length).toBe(2);
    });

    describe('permissions', () => {
      const userContextMocker = new UserInContextMockFactory();

      afterAll(() => {
        userContextMocker.mockEditorUser();
      });

      it("should not return unpublished if there's no logged-in user", async () => {
        userContextMocker.mock(undefined);
        const res: SuperTestResponse = await request(app)
          .get('/api/search/lookup')
          .set('content-language', 'es')
          .query({ searchTerm: 'unpublished' });

        expect(res.body.options.length).toBe(0);
      });

      it('should only return unpublished if the logged user has permissions on the entity', async () => {
        const collabUser = {
          _id: 'collabId',
          role: UserRole.COLLABORATOR,
          username: 'collabUser',
          email: 'collab@test.com',
        };
        new UserInContextMockFactory().mock(collabUser);
        let res: SuperTestResponse = await request(app)
          .get('/api/search/lookup')
          .set('content-language', 'es')
          .query({ searchTerm: 'unpublished' });

        expect(res.body.options.length).toBe(0);

        res = await request(app)
          .get('/api/search/lookup')
          .set('content-language', 'es')
          .query({ searchTerm: 'with permissions but not published', unpublished: true });

        expect(res.body.options.length).toBe(1);
      });
    });
  });

  describe('GET /search/lookupaggregation', () => {
    it('should return a list of options matching by label and options related to the matching one', async () => {
      const query = {
        types: [ids.template1],
        filters: {},
      };

      const res = await request(app)
        .get('/api/search/lookupaggregation')
        .query({ query: JSON.stringify(query), searchTerm: 'Bat', property: 'relationship' });

      const { options } = res.body;

      expect(options.length).toBe(1);
      expect(options[0].value).toBeDefined();
      expect(options[0].label).toBeDefined();
      expect(options[0].results).toBeDefined();
    });

    it('should manage JSON.parse errors (do not return 500)', async () => {
      const res = await request(app)
        .get('/api/search/lookupaggregation')
        .query({ query: 'undefined', searchTerm: 'Bat', property: 'relationship' });

      expect(res.status).toBe(400);
    });

    it('should respond 400 when property does not exists', async () => {
      const res = await request(app)
        .get('/api/search/lookupaggregation')
        .query({ query: JSON.stringify({}), searchTerm: 'Bat', property: 'nonExistant' });

      expect(res.status).toBe(400);
    });

    it('should not throw error when searchTerm is not present', async () => {
      const res = await request(app)
        .get('/api/search/lookupaggregation')
        .query({ query: JSON.stringify({}), property: 'relationship' });

      expect(res.status).toBe(200);
    });
  });
});
