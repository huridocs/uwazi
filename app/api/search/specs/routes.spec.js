import documentRoutes from '../routes.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import search from '../search';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('search routes', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(documentRoutes);
  });

  describe('/api/search/count_by_template', () => {
    it('should return count of search using a specific template', (done) => {
      spyOn(search, 'countByTemplate').and.returnValue(new Promise((resolve) => resolve(2)));
      let req = {query: {templateId: 'templateId'}};

      routes.get('/api/search/count_by_template', req)
      .then((response) => {
        expect(search.countByTemplate).toHaveBeenCalledWith('templateId');
        expect(response).toEqual(2);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/api/search', () => {
    it('should search search and return the results', (done) => {
      spyOn(search, 'search').and.returnValue(new Promise((resolve) => resolve('results')));
      let filtersValue = JSON.stringify({property: 'property'});
      let types = JSON.stringify(['ruling', 'judgement']);
      let fields = JSON.stringify(['field1', 'field2']);
      let req = {query: {searchTerm: 'test', filters: filtersValue, types, fields}, language: 'es'};

      routes.get('/api/search', req)
      .then((response) => {
        expect(search.search).toHaveBeenCalledWith(
          {searchTerm: 'test', filters: {property: 'property'}, types: ['ruling', 'judgement'], fields: ['field1', 'field2']},
          'es'
        );
        expect(response).toEqual('results');
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when has no filters or types', () => {
      it('should search search and return the results', (done) => {
        spyOn(search, 'search').and.returnValue(new Promise((resolve) => resolve('results')));
        let req = {query: {}, language: 'es'};

        routes.get('/api/search', req)
        .then((response) => {
          expect(search.search).toHaveBeenCalledWith({}, 'es');
          expect(response).toEqual('results');
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('/api/search/match_title', () => {
    it('should search search by title and return the results', (done) => {
      spyOn(search, 'matchTitle').and.returnValue(new Promise((resolve) => resolve('results')));
      let req = {query: {searchTerm: 'test'}, language: 'es'};

      routes.get('/api/search/match_title', req)
      .then((response) => {
        expect(response).toEqual('results');
        expect(search.matchTitle).toHaveBeenCalledWith('test', 'es');
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
