import request, { Response as SuperTestResponse } from 'supertest';
import { Application } from 'express';

import db from 'api/utils/testing_db';

import { setUpApp } from 'api/utils/testingRoutes';
import searchRoutes from 'api/search/routes';

import { UserRole } from 'shared/types/userSchema';
import { fixtures, ids, fixturesTimeOut } from './fixtures_elastic';
import { UserInContextMockFactory } from '../../utils/testingUserInContext';

describe('Search routes', () => {
  const app: Application = setUpApp(searchRoutes);
  const elasticIndex = 'search_lookup_index_test';

  beforeAll(async () => {
    //@ts-ignore
    await db.clearAllAndLoad(fixtures, elasticIndex);
  }, fixturesTimeOut);

  afterAll(async () => db.disconnect());

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
  });
});
