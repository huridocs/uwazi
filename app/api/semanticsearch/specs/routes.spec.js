import semanticSearch from '../semanticSearch';
import { catchErrors } from 'api/utils/jasmineHelpers';
import semanticRoutes from '../routes.js';
import instrumentRoutes from '../../utils/instrumentRoutes';

describe('search routes', () => {
  let routes;
  beforeEach(() => {
    routes = instrumentRoutes(semanticRoutes);
  });

  describe('POST /api/semantic-search', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/semantic-search')).toMatchSnapshot();
    });

    it('should create a semantic search', (done) => {
      const result = { status: 'pending' };
      const body = {
        searchTerm: 'term',
        query: {},
        documents: []
      };
      jest.spyOn(semanticSearch, 'create').mockResolvedValue(result);
      const req = { language: 'en', user: 'user', body };

      routes.post('/api/semantic-search', req)
      .then((res) => {
        expect(res).toEqual(result);
        expect(semanticSearch.create).toHaveBeenCalledWith(body, 'en', 'user');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('GET /api/semantic-search', () => {
    it('should return all searches', (done) => {
      const result = [{ _id: 's1' }, { _id: 's2' }];
      jest.spyOn(semanticSearch, 'getAllSearches').mockResolvedValue(result);
      const req = {};

      routes.get('/api/semantic-search', req)
      .then((response) => {
        expect(response).toEqual(result);
        expect(semanticSearch.getAllSearches).toHaveBeenCalled();
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('GET /api/semantic-search/:searchId', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/semantic-search/:searchId')).toMatchSnapshot();
    });

    it('should return specified search', (done) => {
      const result = { _id: 's1' };
      jest.spyOn(semanticSearch, 'getSearch').mockResolvedValue(result);
      const req = {
        params: { searchId: 's1' },
        query: { limit: '30', skip: '90', threshold: '0.5' }
      };

      routes.get('/api/semantic-search/:searchId', req)
      .then((response) => {
        expect(response).toEqual(result);
        expect(semanticSearch.getSearch).toHaveBeenCalledWith('s1',
          { limit: 30, skip: 90, threshold: 0.5, minRelevantSentences: 5 });
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('GET /api/semantic-search/:searchId/list', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/semantic-search/:searchId/list')).toMatchSnapshot();
    });

    it('should return all search result docs ids that match filters', (done) => {
      const result = [{ sharedId: '1', template: 't1' }];
      jest.spyOn(semanticSearch, 'listSearchResultsDocs').mockResolvedValue(result);
      const req = { params: { searchId: 's1' }, query: { threshold: '0.5', minRelevantSentences: '2' } };

      routes.get('/api/semantic-search/:searchId/list', req)
      .then((response) => {
        expect(response).toEqual(result);
        expect(semanticSearch.listSearchResultsDocs).toHaveBeenCalledWith('s1', { threshold: 0.5, minRelevantSentences: 2 });
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('DELETE /api/semantic-search/:searchId', () => {
    it('should delete specified', (done) => {
      const result = { _id: 's1' };
      jest.spyOn(semanticSearch, 'deleteSearch').mockResolvedValue(result);
      const req = { params: { searchId: 's1' } };

      routes.delete('/api/semantic-search/:searchId', req)
      .then((response) => {
        expect(response).toEqual(result);
        expect(semanticSearch.deleteSearch).toHaveBeenCalledWith('s1');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('POST /api/semantic-search/:searchId/stop', () => {
    it('should stop the search', (done) => {
      const result = { _id: 's1' };
      jest.spyOn(semanticSearch, 'stopSearch').mockResolvedValue(result);
      const req = { params: { searchId: 's1' } };

      routes.post('/api/semantic-search/:searchId/stop', req)
      .then((response) => {
        expect(response).toEqual(result);
        expect(semanticSearch.stopSearch).toHaveBeenCalledWith('s1');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('POST /api/semantic-search/:searchId/resume', () => {
    it('should resume the search', (done) => {
      const result = { _id: 's1' };
      jest.spyOn(semanticSearch, 'resumeSearch').mockResolvedValue(result);
      const req = { params: { searchId: 's1' } };

      routes.post('/api/semantic-search/:searchId/resume', req)
      .then((response) => {
        expect(response).toEqual(result);
        expect(semanticSearch.resumeSearch).toHaveBeenCalledWith('s1');
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
