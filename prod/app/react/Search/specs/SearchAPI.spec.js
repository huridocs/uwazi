"use strict";var _config = require("../../config.js");
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _RequestParams = require("../../utils/RequestParams");
var _SearchAPI = _interopRequireDefault(require("../SearchAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SearchAPI', () => {
  const searchResponse = [{ documents: 'search' }];
  const filteredSearchResult = [{ documents: 'Alfred' }];
  const listResponse = [{ documents: 'list' }];

  beforeEach(() => {
    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}search`, { body: JSON.stringify(searchResponse) }).
    get(`${_config.APIURL}search_snippets?searchTerm=term&id=id`, { body: JSON.stringify(searchResponse) }).
    get(`${_config.APIURL}search/list?keys=%5B%221%22%2C%222%22%5D`, { body: JSON.stringify({ rows: listResponse }) }).
    get(`${_config.APIURL}search/unpublished`, { body: JSON.stringify({ rows: 'uploads' }) }).
    get(`${_config.APIURL}search/count_by_template?templateId=templateId`, { body: JSON.stringify(1) }).
    get(`${_config.APIURL}search/match_title?searchTerm=term`, { body: JSON.stringify(searchResponse) }).
    get(`${_config.APIURL}search?searchTerm=Batman&joker=true`, { body: JSON.stringify(filteredSearchResult) });
  });

  afterEach(() => _fetchMock.default.restore());

  describe('unpublished', () => {
    it('should request unpublished', done => {
      _SearchAPI.default.unpublished().
      then(response => {
        expect(response).toEqual('uploads');
        done();
      }).
      catch(done.fail);
    });
  });

  describe('list()', () => {
    it('should request documents list', done => {
      const requestParams = new _RequestParams.RequestParams({ keys: ['1', '2'] });
      _SearchAPI.default.list(requestParams).
      then(response => {
        expect(response).toEqual(listResponse);
        done();
      }).
      catch(done.fail);
    });
  });

  describe('getSuggestions()', () => {
    it('should match_title ', done => {
      const requestParams = new _RequestParams.RequestParams({ searchTerm: 'term' });
      _SearchAPI.default.getSuggestions(requestParams).
      then(response => {
        expect(response).toEqual(searchResponse);
        done();
      }).
      catch(done.fail);
    });
  });

  describe('countByTemplate()', () => {
    it('should count_by_template', done => {
      const requestParams = new _RequestParams.RequestParams({ templateId: 'templateId' });
      _SearchAPI.default.countByTemplate(requestParams).
      then(response => {
        expect(response).toEqual(1);
        done();
      }).
      catch(done.fail);
    });
  });

  describe('searchSnippets()', () => {
    it('should search snippets for a certain document', done => {
      const requestParams = new _RequestParams.RequestParams({ searchTerm: 'term', id: 'id' });
      _SearchAPI.default.searchSnippets(requestParams).
      then(response => {
        expect(response).toEqual(searchResponse);
        done();
      }).
      catch(done.fail);
    });
  });

  describe('search()', () => {
    it('should search documents', done => {
      _SearchAPI.default.search().
      then(response => {
        expect(response).toEqual(searchResponse);
        done();
      }).
      catch(done.fail);
    });

    describe('when passing filters', () => {
      it('should search for it', done => {
        const requestParams = new _RequestParams.RequestParams({ searchTerm: 'Batman', joker: true });
        _SearchAPI.default.search(requestParams).
        then(response => {
          expect(response).toEqual(filteredSearchResult);
          done();
        }).
        catch(done.fail);
      });
    });
  });
});