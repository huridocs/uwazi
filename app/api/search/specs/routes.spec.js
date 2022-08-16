import request from 'supertest';
import entities from 'api/entities';
import { catchErrors } from 'api/utils/jasmineHelpers';
import { testingDB } from 'api/utils/testing_db';
import { setUpApp } from 'api/utils/testingRoutes';
import searchRoutes from '../deprecatedRoutes.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import { search } from '../search';

jest.mock('api/utils/AppContext');

describe('search routes', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(searchRoutes);
  });

  describe('/api/search/count_by_template', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/search/count_by_template')).toMatchSnapshot();
    });

    it('should return count of search using a specific template', done => {
      spyOn(entities, 'countByTemplate').and.callFake(async () => Promise.resolve(2));
      const req = { query: { templateId: 'templateId' } };

      routes
        .get('/api/search/count_by_template', req)
        .then(response => {
          expect(response).toEqual(2);
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('/api/search', () => {
    beforeEach(() => {
      spyOn(search, 'search').and.callFake(async () => Promise.resolve('results'));
      spyOn(search, 'searchGeolocations').and.callFake(async () =>
        Promise.resolve('geolocation results')
      );
    });

    const assessSearch = async (req, action, expectedResults, expectedArgs) => {
      const response = await routes.get('/api/search', req);
      expect(search[action]).toHaveBeenCalledWith(...expectedArgs);
      expect(response).toEqual(expectedResults);
    };

    it('should search search and return the results', async () => {
      const filtersValue = { property: 'property' };
      const types = ['ruling', 'judgement'];
      const fields = ['field1', 'field2'];
      const req = {
        query: { searchTerm: 'test', filters: filtersValue, types, fields },
        language: 'es',
        user: 'user',
      };

      const expectedArgs = [
        {
          searchTerm: 'test',
          filters: { property: 'property' },
          types: ['ruling', 'judgement'],
          fields: ['field1', 'field2'],
        },
        'es',
        'user',
      ];
      await assessSearch(req, 'search', 'results', expectedArgs);
    });

    describe('when has no filters or types', () => {
      it('should search search and return the results', async () => {
        const req = { query: {}, language: 'es', user: 'user' };
        await assessSearch(req, 'search', 'results', [{}, 'es', 'user']);
      });
    });

    describe('geolocation search', () => {
      it('should point to searchGeolocations', async () => {
        const req = { query: { geolocation: true }, language: 'es', user: 'user' };
        await assessSearch(req, 'searchGeolocations', 'geolocation results', [
          { geolocation: true },
          'es',
          'user',
        ]);
      });
    });
  });

  describe('/api/search_snippets', () => {
    const app = setUpApp(searchRoutes);

    afterAll(async () => testingDB.disconnect());

    it('should have a validation schema', async () => {
      await testingDB.clearAllAndLoad({
        settings: [
          {
            languages: [{ key: 'es', default: true }, { key: 'pt' }, { key: 'en' }],
          },
        ],
      });
      const response = await request(app).get('/api/search_snippets?searchTerm=test').send({});
      expect(response.text).toMatch(/must have required property 'id'/);
    });

    it('should search', done => {
      spyOn(search, 'searchSnippets').and.callFake(async () => Promise.resolve('results'));
      const req = {
        query: { searchTerm: 'test', id: 'id' },
        language: 'es',
        user: { _id: 'userId' },
      };

      routes
        .get('/api/search_snippets', req)
        .then(response => {
          expect(response).toEqual('results');
          expect(search.searchSnippets).toHaveBeenCalledWith('test', 'id', 'es', req.user);
          done();
        })
        .catch(catchErrors(done));
    });
  });
});
