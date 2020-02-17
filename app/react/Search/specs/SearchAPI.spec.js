import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import { RequestParams } from 'app/utils/RequestParams';
import searchAPI from '../SearchAPI';

describe('SearchAPI', () => {
  const searchResponse = [{ documents: 'search' }];
  const filteredSearchResult = [{ documents: 'Alfred' }];
  const listResponse = [{ documents: 'list' }];

  beforeEach(() => {
    backend.restore();
    backend
      .get(`${APIURL}search`, { body: JSON.stringify(searchResponse) })
      .get(`${APIURL}search_snippets?searchTerm=term&id=id`, {
        body: JSON.stringify(searchResponse),
      })
      .get(`${APIURL}search/list?keys=%5B%221%22%2C%222%22%5D`, {
        body: JSON.stringify({ rows: listResponse }),
      })
      .get(`${APIURL}search/unpublished`, { body: JSON.stringify({ rows: 'uploads' }) })
      .get(`${APIURL}search/count_by_template?templateId=templateId`, { body: JSON.stringify(1) })
      .get(`${APIURL}search/match_title?searchTerm=term`, { body: JSON.stringify(searchResponse) })
      .get(`${APIURL}search?searchTerm=Batman&joker=true`, {
        body: JSON.stringify(filteredSearchResult),
      });
  });

  afterEach(() => backend.restore());

  describe('unpublished', () => {
    it('should request unpublished', done => {
      searchAPI
        .unpublished()
        .then(response => {
          expect(response).toEqual('uploads');
          done();
        })
        .catch(done.fail);
    });
  });

  describe('list()', () => {
    it('should request documents list', done => {
      const requestParams = new RequestParams({ keys: ['1', '2'] });
      searchAPI
        .list(requestParams)
        .then(response => {
          expect(response).toEqual(listResponse);
          done();
        })
        .catch(done.fail);
    });
  });

  describe('getSuggestions()', () => {
    it('should match_title ', done => {
      const requestParams = new RequestParams({ searchTerm: 'term' });
      searchAPI
        .getSuggestions(requestParams)
        .then(response => {
          expect(response).toEqual(searchResponse);
          done();
        })
        .catch(done.fail);
    });
  });

  describe('countByTemplate()', () => {
    it('should count_by_template', done => {
      const requestParams = new RequestParams({ templateId: 'templateId' });
      searchAPI
        .countByTemplate(requestParams)
        .then(response => {
          expect(response).toEqual(1);
          done();
        })
        .catch(done.fail);
    });
  });

  describe('searchSnippets()', () => {
    it('should search snippets for a certain document', done => {
      const requestParams = new RequestParams({ searchTerm: 'term', id: 'id' });
      searchAPI
        .searchSnippets(requestParams)
        .then(response => {
          expect(response).toEqual(searchResponse);
          done();
        })
        .catch(done.fail);
    });
  });

  describe('search()', () => {
    it('should search documents', done => {
      searchAPI
        .search()
        .then(response => {
          expect(response).toEqual(searchResponse);
          done();
        })
        .catch(done.fail);
    });

    describe('when passing filters', () => {
      it('should search for it', done => {
        const requestParams = new RequestParams({ searchTerm: 'Batman', joker: true });
        searchAPI
          .search(requestParams)
          .then(response => {
            expect(response).toEqual(filteredSearchResult);
            done();
          })
          .catch(done.fail);
      });
    });
  });
});
