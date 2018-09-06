import entities from 'api/entities';
import { catchErrors } from 'api/utils/jasmineHelpers';
import documentRoutes from '../routes.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import search from '../search';


describe('search routes', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(documentRoutes);
  });

  describe('/api/search/count_by_template', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/search/count_by_template')).toMatchSnapshot();
    });

    it('should return count of search using a specific template', (done) => {
      spyOn(entities, 'countByTemplate').and.returnValue(new Promise(resolve => resolve(2)));
      const req = { query: { templateId: 'templateId' } };

      routes.get('/api/search/count_by_template', req)
      .then((response) => {
        expect(response).toEqual(2);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/api/search', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/search')).toMatchSnapshot();
    });

    it('should search search and return the results', (done) => {
      spyOn(search, 'search').and.returnValue(new Promise(resolve => resolve('results')));
      const filtersValue = JSON.stringify({ property: 'property' });
      const types = JSON.stringify(['ruling', 'judgement']);
      const fields = JSON.stringify(['field1', 'field2']);
      const req = { query: { searchTerm: 'test', filters: filtersValue, types, fields }, language: 'es', user: 'user' };

      routes.get('/api/search', req)
      .then((response) => {
        expect(search.search).toHaveBeenCalledWith(
          { searchTerm: 'test', filters: { property: 'property' }, types: ['ruling', 'judgement'], fields: ['field1', 'field2'] },
          'es',
          'user'
        );
        expect(response).toEqual('results');
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when has no filters or types', () => {
      it('should search search and return the results', (done) => {
        spyOn(search, 'search').and.returnValue(new Promise(resolve => resolve('results')));
        const req = { query: {}, language: 'es', user: 'user' };

        routes.get('/api/search', req)
        .then((response) => {
          expect(search.search).toHaveBeenCalledWith({}, 'es', 'user');
          expect(response).toEqual('results');
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('/api/search_snippets', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/search_snippets')).toMatchSnapshot();
    });

    it('should search', (done) => {
      spyOn(search, 'searchSnippets').and.returnValue(new Promise(resolve => resolve('results')));
      const req = { query: { searchTerm: 'test', id: 'id' }, language: 'es' };

      routes.get('/api/search_snippets', req)
      .then((response) => {
        expect(response).toEqual('results');
        expect(search.searchSnippets).toHaveBeenCalledWith('test', 'id', 'es');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/api/search/unpublished', () => {
    it('should search', (done) => {
      spyOn(search, 'getUploadsByUser').and.returnValue(new Promise(resolve => resolve('results')));
      const req = { query: { searchTerm: 'test', id: 'id' }, language: 'es' };

      routes.get('/api/search/unpublished', req)
      .then((response) => {
        expect(response).toEqual({ rows: 'results' });
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
