"use strict";var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _config = require("../../config.js");
var _RequestParams = require("../../utils/RequestParams");

var _SemanticSearchAPI = _interopRequireDefault(require("../SemanticSearchAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SemanticSearchAPI', () => {
  let searchId;
  const createdResponse = { _id: 'searchCreated' };
  const stoppedResponse = { _id: 'searchId', status: 'stopped' };
  const resumedResponse = { _id: 'searchId', status: 'resumed' };
  const deletedResponse = { _id: 'deleted' };
  const singleResponse = { _id: 'searchId' };
  const resultListResponse = [{ sharedId: 'id1', template: 'tpl1' }];
  const searchListResponse = [{ _id: 'search1' }, { _id: 'search2' }];
  const okResponse = { ok: true };
  beforeEach(() => {
    searchId = 'searchId';
    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}semantic-search/?searchId=${searchId}`, { body: JSON.stringify(singleResponse) }).
    get(`${_config.APIURL}semantic-search/list?searchId=searchId&minRelevantSentences=5&threshold=0.5`, { body: JSON.stringify(resultListResponse) }).
    get(`${_config.APIURL}semantic-search`, { body: JSON.stringify(searchListResponse) }).
    delete(`${_config.APIURL}semantic-search/?searchId=${searchId}`, { body: JSON.stringify(deletedResponse) }).
    post(`${_config.APIURL}semantic-search/stop`, { body: JSON.stringify(stoppedResponse) }).
    post(`${_config.APIURL}semantic-search/resume`, { body: JSON.stringify(resumedResponse) }).
    post(`${_config.APIURL}semantic-search`, { body: JSON.stringify(createdResponse) }).
    post(`${_config.APIURL}semantic-search/notify-updates`, { body: JSON.stringify(okResponse) });
  });

  afterEach(() => {
    _fetchMock.default.restore();
  });

  describe('search', () => {
    it('should post a new search', async () => {
      const requestParams = new _RequestParams.RequestParams({ searchTerm: 'term' });
      const response = await _SemanticSearchAPI.default.search(requestParams);
      expect(response).toEqual(createdResponse);
      expect(JSON.parse(_fetchMock.default.lastOptions(`${_config.APIURL}semantic-search`).body)).toEqual(requestParams.data);
    });
  });

  describe('stop', () => {
    it('should request stop', async () => {
      const response = await _SemanticSearchAPI.default.stopSearch(new _RequestParams.RequestParams({ searchId }));
      expect(response).toEqual(stoppedResponse);
    });
  });

  describe('resume', () => {
    it('should request resume', async () => {
      const response = await _SemanticSearchAPI.default.resumeSearch(new _RequestParams.RequestParams({ searchId }));
      expect(response).toEqual(resumedResponse);
    });
  });

  describe('delete', () => {
    it('should delete the search', async () => {
      const response = await _SemanticSearchAPI.default.deleteSearch(new _RequestParams.RequestParams({ searchId }));
      expect(response).toEqual(deletedResponse);
    });
  });

  describe('getSearch', () => {
    it('should request the search', async () => {
      const response = await _SemanticSearchAPI.default.getSearch(new _RequestParams.RequestParams({ searchId }));
      expect(response).toEqual(singleResponse);
    });
  });

  describe('getAllSearches', () => {
    it('should request all searches', async () => {
      const response = await _SemanticSearchAPI.default.getAllSearches();
      expect(response).toEqual(searchListResponse);
    });
  });

  describe('registerForUpdates', () => {
    it('should request update notifications', async () => {
      const response = await _SemanticSearchAPI.default.registerForUpdates();
      expect(response).toEqual(okResponse);
    });
  });

  describe('getEntitiesMatchingFilters', () => {
    it('should request list of all results matching filters', async () => {
      const requestParams = new _RequestParams.RequestParams({ searchId, minRelevantSentences: 5, threshold: 0.5 });
      const response = await _SemanticSearchAPI.default.getEntitiesMatchingFilters(requestParams);
      expect(response).toEqual(resultListResponse);
    });
  });
});