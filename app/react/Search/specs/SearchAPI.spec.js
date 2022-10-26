import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import { RequestParams } from 'app/utils/RequestParams';
import api from 'app/utils/api';
import SearchApi from '../SearchAPI';

describe('SearchAPI', () => {
  const searchResponse = [{ documents: 'search' }];
  const filteredSearchResult = [{ documents: 'Alfred' }];
  const listResponse = [{ documents: 'list' }];

  beforeEach(() => {
    backend.restore();
    backend
      .get(`${APIURL}search?include=%5B%22permissions%22%5D`, {
        body: JSON.stringify(searchResponse),
      })
      .get(`${APIURL}v2/search?searchTerm=term&id=id`, {
        body: JSON.stringify(searchResponse),
      })
      .get(`${APIURL}search/list?keys=%5B%221%22%2C%222%22%5D`, {
        body: JSON.stringify({ rows: listResponse }),
      })
      .get(`${APIURL}search/unpublished`, { body: JSON.stringify({ rows: 'uploads' }) })
      .get(`${APIURL}search/count_by_template?templateId=templateId`, { body: JSON.stringify(1) })
      .get(`${APIURL}search?searchTerm=Batman&joker=true&include=%5B%22permissions%22%5D`, {
        body: JSON.stringify(filteredSearchResult),
      });
  });

  afterEach(() => backend.restore());

  describe('list()', () => {
    it('should request documents list', done => {
      const requestParams = new RequestParams({ keys: ['1', '2'] });
      SearchApi.list(requestParams)
        .then(response => {
          expect(response).toEqual(listResponse);
          done();
        })
        .catch(done.fail);
    });
  });

  describe('countByTemplate()', () => {
    it('should count_by_template', done => {
      const requestParams = new RequestParams({ templateId: 'templateId' });
      SearchApi.countByTemplate(requestParams)
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
      SearchApi.searchSnippets(requestParams)
        .then(response => {
          expect(response).toEqual(searchResponse);
          done();
        })
        .catch(done.fail);
    });
  });

  describe('search()', () => {
    it('should search documents', done => {
      SearchApi.search()
        .then(response => {
          expect(response).toEqual(searchResponse);
          done();
        })
        .catch(done.fail);
    });

    it('should add permissions to the includes', async () => {
      spyOn(api, 'get').and.callFake(async () => Promise.resolve({ json: {} }));
      SearchApi.search();
      expect(api.get).toHaveBeenCalledWith(
        'search',
        new RequestParams({ include: ['permissions'] })
      );

      SearchApi.search(new RequestParams({ include: ['include'] }));
      expect(api.get).toHaveBeenCalledWith(
        'search',
        new RequestParams({ include: ['include', 'permissions'] })
      );
    });

    describe('when passing filters', () => {
      it('should search for it', done => {
        const requestParams = new RequestParams({ searchTerm: 'Batman', joker: true });
        SearchApi.search(requestParams)
          .then(response => {
            expect(response).toEqual(filteredSearchResult);
            done();
          })
          .catch(done.fail);
      });
    });
  });
});
