import semanticSearch from '../semanticSearch';
import semanticRoutes from '../routes.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import updateNotifier from '../updateNotifier';

describe('search routes', () => {
  let routes;
  beforeEach(() => {
    routes = instrumentRoutes(semanticRoutes);
  });

  describe('POST /api/semantic-search', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/semantic-search')).toMatchSnapshot();
    });

    it('should create a semantic search', async () => {
      const result = { status: 'pending' };
      const body = {
        searchTerm: 'term',
        query: {},
        documents: [],
      };
      jest.spyOn(semanticSearch, 'create').mockResolvedValue(result);
      const req = { language: 'en', user: 'user', body };

      const res = await routes.post('/api/semantic-search', req);
      expect(res).toEqual(result);
      expect(semanticSearch.create).toHaveBeenCalledWith(body, 'en', 'user');
    });
  });

  describe('GET /api/semantic-search', () => {
    it('should return all searches', async () => {
      const result = [{ _id: 's1' }, { _id: 's2' }];
      jest.spyOn(semanticSearch, 'getAllSearches').mockResolvedValue(result);
      const req = { query: {} };

      const response = await routes.get('/api/semantic-search', req);
      expect(response).toEqual(result);
      expect(semanticSearch.getAllSearches).toHaveBeenCalledWith();
    });
  });

  describe('GET /api/semantic-search', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/semantic-search')).toMatchSnapshot();
    });

    it('should return specified search', async () => {
      const result = { _id: 's1' };
      jest.spyOn(semanticSearch, 'getSearch').mockResolvedValue(result);
      const req = {
        query: { searchId: 's1', limit: '30', skip: '90', threshold: '0.5' },
      };

      const response = await routes.get('/api/semantic-search', req);
      expect(response).toEqual(result);
      expect(semanticSearch.getSearch).toHaveBeenCalledWith('s1', {
        limit: 30,
        skip: 90,
        threshold: 0.5,
        minRelevantSentences: 5,
      });
    });
  });

  describe('GET /api/semantic-search/list', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/semantic-search/list')).toMatchSnapshot();
    });

    it('should return all search result docs ids that match filters', async () => {
      const result = [{ sharedId: '1', template: 't1' }];
      jest.spyOn(semanticSearch, 'listSearchResultsDocs').mockResolvedValue(result);
      const req = { query: { searchId: 's1', threshold: '0.5', minRelevantSentences: '2' } };

      const response = await routes.get('/api/semantic-search/list', req);
      expect(response).toEqual(result);
      expect(semanticSearch.listSearchResultsDocs).toHaveBeenCalledWith('s1', {
        threshold: 0.5,
        minRelevantSentences: 2,
      });
    });
  });

  describe('DELETE /api/semantic-search', () => {
    it('should delete specified', async () => {
      const result = { _id: 's1' };
      jest.spyOn(semanticSearch, 'deleteSearch').mockResolvedValue(result);
      const req = { query: { searchId: 's1' } };

      const response = await routes.delete('/api/semantic-search', req);
      expect(response).toEqual(result);
      expect(semanticSearch.deleteSearch).toHaveBeenCalledWith('s1');
    });
  });

  describe('POST /api/semantic-search/stop', () => {
    it('should stop the search', async () => {
      const result = { _id: 's1' };
      jest.spyOn(semanticSearch, 'stopSearch').mockResolvedValue(result);
      const req = { body: { searchId: 's1' } };

      const response = await routes.post('/api/semantic-search/stop', req);
      expect(response).toEqual(result);
      expect(semanticSearch.stopSearch).toHaveBeenCalledWith('s1');
    });
  });

  describe('POST /api/semantic-search/resume', () => {
    it('should resume the search', async () => {
      const result = { _id: 's1' };
      jest.spyOn(semanticSearch, 'resumeSearch').mockResolvedValue(result);
      const req = { body: { searchId: 's1' } };

      const response = await routes.post('/api/semantic-search/resume', req);
      expect(response).toEqual(result);
      expect(semanticSearch.resumeSearch).toHaveBeenCalledWith('s1');
    });
  });

  describe('POST /api/semantic-search/notify-updates', () => {
    it('should register user session for receiving updates', async () => {
      jest.spyOn(updateNotifier, 'addRequest').mockReturnValueOnce();
      const req = {};
      const response = await routes.post('/api/semantic-search/notify-updates', req);
      expect(response).toEqual({ ok: true });
      expect(updateNotifier.addRequest).toHaveBeenCalledWith(req);
    });
  });
});
