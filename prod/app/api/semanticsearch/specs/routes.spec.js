"use strict";var _semanticSearch = _interopRequireDefault(require("../semanticSearch"));
var _routes = _interopRequireDefault(require("../routes.js"));
var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));
var _updateNotifier = _interopRequireDefault(require("../updateNotifier"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('search routes', () => {
  let routes;
  beforeEach(() => {
    routes = (0, _instrumentRoutes.default)(_routes.default);
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
        documents: [] };

      jest.spyOn(_semanticSearch.default, 'create').mockResolvedValue(result);
      const req = { language: 'en', user: 'user', body };

      const res = await routes.post('/api/semantic-search', req);
      expect(res).toEqual(result);
      expect(_semanticSearch.default.create).toHaveBeenCalledWith(body, 'en', 'user');
    });
  });

  describe('GET /api/semantic-search', () => {
    it('should return all searches', async () => {
      const result = [{ _id: 's1' }, { _id: 's2' }];
      jest.spyOn(_semanticSearch.default, 'getAllSearches').mockResolvedValue(result);
      const req = { query: {} };

      const response = await routes.get('/api/semantic-search', req);
      expect(response).toEqual(result);
      expect(_semanticSearch.default.getAllSearches).toHaveBeenCalledWith();
    });
  });

  describe('GET /api/semantic-search', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/semantic-search')).toMatchSnapshot();
    });

    it('should return specified search', async () => {
      const result = { _id: 's1' };
      jest.spyOn(_semanticSearch.default, 'getSearch').mockResolvedValue(result);
      const req = {
        query: { searchId: 's1', limit: '30', skip: '90', threshold: '0.5' } };


      const response = await routes.get('/api/semantic-search', req);
      expect(response).toEqual(result);
      expect(_semanticSearch.default.getSearch).toHaveBeenCalledWith('s1',
      { limit: 30, skip: 90, threshold: 0.5, minRelevantSentences: 5 });
    });
  });

  describe('GET /api/semantic-search/list', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/semantic-search/list')).toMatchSnapshot();
    });

    it('should return all search result docs ids that match filters', async () => {
      const result = [{ sharedId: '1', template: 't1' }];
      jest.spyOn(_semanticSearch.default, 'listSearchResultsDocs').mockResolvedValue(result);
      const req = { query: { searchId: 's1', threshold: '0.5', minRelevantSentences: '2' } };

      const response = await routes.get('/api/semantic-search/list', req);
      expect(response).toEqual(result);
      expect(_semanticSearch.default.listSearchResultsDocs).toHaveBeenCalledWith('s1', { threshold: 0.5, minRelevantSentences: 2 });
    });
  });

  describe('DELETE /api/semantic-search', () => {
    it('should delete specified', async () => {
      const result = { _id: 's1' };
      jest.spyOn(_semanticSearch.default, 'deleteSearch').mockResolvedValue(result);
      const req = { query: { searchId: 's1' } };

      const response = await routes.delete('/api/semantic-search', req);
      expect(response).toEqual(result);
      expect(_semanticSearch.default.deleteSearch).toHaveBeenCalledWith('s1');
    });
  });

  describe('POST /api/semantic-search/stop', () => {
    it('should stop the search', async () => {
      const result = { _id: 's1' };
      jest.spyOn(_semanticSearch.default, 'stopSearch').mockResolvedValue(result);
      const req = { query: { searchId: 's1' } };

      const response = await routes.post('/api/semantic-search/stop', req);
      expect(response).toEqual(result);
      expect(_semanticSearch.default.stopSearch).toHaveBeenCalledWith('s1');
    });
  });

  describe('POST /api/semantic-search/resume', () => {
    it('should resume the search', async () => {
      const result = { _id: 's1' };
      jest.spyOn(_semanticSearch.default, 'resumeSearch').mockResolvedValue(result);
      const req = { query: { searchId: 's1' } };

      const response = await routes.post('/api/semantic-search/resume', req);
      expect(response).toEqual(result);
      expect(_semanticSearch.default.resumeSearch).toHaveBeenCalledWith('s1');
    });
  });

  describe('POST /api/semantic-search/notify-updates', () => {
    it('should register user session for receiving updates', async () => {
      jest.spyOn(_updateNotifier.default, 'addRequest').mockReturnValueOnce();
      const req = {};
      const response = await routes.post('/api/semantic-search/notify-updates', req);
      expect(response).toEqual({ ok: true });
      expect(_updateNotifier.default.addRequest).toHaveBeenCalledWith(req);
    });
  });
});