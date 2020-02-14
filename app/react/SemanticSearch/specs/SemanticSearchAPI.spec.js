import backend from 'fetch-mock';
import { APIURL } from 'app/config.js';
import { RequestParams } from 'app/utils/RequestParams';

import semanticSearchAPI from '../SemanticSearchAPI';

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
    backend.restore();
    backend
      .get(`${APIURL}semantic-search?searchId=${searchId}`, {
        body: JSON.stringify(singleResponse),
      })
      .get(`${APIURL}semantic-search/list?searchId=searchId&minRelevantSentences=5&threshold=0.5`, {
        body: JSON.stringify(resultListResponse),
      })
      .get(`${APIURL}semantic-search`, { body: JSON.stringify(searchListResponse) })
      .delete(`${APIURL}semantic-search?searchId=${searchId}`, {
        body: JSON.stringify(deletedResponse),
      })
      .post(`${APIURL}semantic-search/stop`, { body: JSON.stringify(stoppedResponse) })
      .post(`${APIURL}semantic-search/resume`, { body: JSON.stringify(resumedResponse) })
      .post(`${APIURL}semantic-search`, { body: JSON.stringify(createdResponse) })
      .post(`${APIURL}semantic-search/notify-updates`, { body: JSON.stringify(okResponse) });
  });

  afterEach(() => {
    backend.restore();
  });

  describe('search', () => {
    it('should post a new search', async () => {
      const requestParams = new RequestParams({ searchTerm: 'term' });
      const response = await semanticSearchAPI.search(requestParams);
      expect(response).toEqual(createdResponse);
      expect(JSON.parse(backend.lastOptions(`${APIURL}semantic-search`).body)).toEqual(
        requestParams.data
      );
    });
  });

  describe('stop', () => {
    it('should request stop', async () => {
      const response = await semanticSearchAPI.stopSearch(new RequestParams({ searchId }));
      expect(response).toEqual(stoppedResponse);
    });
  });

  describe('resume', () => {
    it('should request resume', async () => {
      const response = await semanticSearchAPI.resumeSearch(new RequestParams({ searchId }));
      expect(response).toEqual(resumedResponse);
    });
  });

  describe('delete', () => {
    it('should delete the search', async () => {
      const response = await semanticSearchAPI.deleteSearch(new RequestParams({ searchId }));
      expect(response).toEqual(deletedResponse);
    });
  });

  describe('getSearch', () => {
    it('should request the search', async () => {
      const response = await semanticSearchAPI.getSearch(new RequestParams({ searchId }));
      expect(response).toEqual(singleResponse);
    });
  });

  describe('getAllSearches', () => {
    it('should request all searches', async () => {
      const response = await semanticSearchAPI.getAllSearches();
      expect(response).toEqual(searchListResponse);
    });
  });

  describe('registerForUpdates', () => {
    it('should request update notifications', async () => {
      const response = await semanticSearchAPI.registerForUpdates();
      expect(response).toEqual(okResponse);
    });
  });

  describe('getEntitiesMatchingFilters', () => {
    it('should request list of all results matching filters', async () => {
      const requestParams = new RequestParams({
        searchId,
        minRelevantSentences: 5,
        threshold: 0.5,
      });
      const response = await semanticSearchAPI.getEntitiesMatchingFilters(requestParams);
      expect(response).toEqual(resultListResponse);
    });
  });
});
