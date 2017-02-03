import searchAPI from '../SearchAPI';
import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';

describe('SearchAPI', () => {
  let searchResponse = [{documents: 'search'}];
  let filteredSearchResult = [{documents: 'Alfred'}];
  let listResponse = [{documents: 'list'}];

  beforeEach(() => {
    backend.restore();
    backend
    .get(APIURL + 'search', {body: JSON.stringify(searchResponse)})
    .get(APIURL + 'search/list?keys=%5B%221%22%2C%222%22%5D', {body: JSON.stringify({rows: listResponse})})
    .get(APIURL + 'search/unpublished', {body: JSON.stringify({rows: 'uploads'})})
    .get(APIURL + 'search/count_by_template?templateId=templateId', {body: JSON.stringify(1)})
    .get(APIURL + 'search/match_title?searchTerm=term', {body: JSON.stringify(searchResponse)})
    .get(APIURL + 'search?searchTerm=Batman&joker=true', {body: JSON.stringify(filteredSearchResult)});
  });

  afterEach(() => backend.restore());

  describe('unpublished', () => {
    it('should request unpublished', (done) => {
      searchAPI.unpublished()
      .then((response) => {
        expect(response).toEqual('uploads');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('list()', () => {
    it('should request documents list', (done) => {
      searchAPI.list(['1', '2'])
      .then((response) => {
        expect(response).toEqual(listResponse);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('getSuggestions()', () => {
    it('should match_title ', (done) => {
      searchAPI.getSuggestions('term')
      .then((response) => {
        expect(response).toEqual(searchResponse);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('countByTemplate()', () => {
    it('should count_by_template', (done) => {
      searchAPI.countByTemplate('templateId')
      .then((response) => {
        expect(response).toEqual(1);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('search()', () => {
    it('should search documents', (done) => {
      searchAPI.search()
      .then((response) => {
        expect(response).toEqual(searchResponse);
        done();
      })
      .catch(done.fail);
    });

    describe('when passing filters', () => {
      it('should search for it', (done) => {
        searchAPI.search({searchTerm: 'Batman', joker: true})
        .then((response) => {
          expect(response).toEqual(filteredSearchResult);
          done();
        })
        .catch(done.fail);
      });
    });
  });
});
