"use strict";var _config = require("../../config.js");
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _RequestParams = require("../../utils/RequestParams");
var _DocumentsAPI = _interopRequireDefault(require("../DocumentsAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('DocumentsAPI', () => {
  const arrayResponse = [{ documents: 'array' }];
  const searchResponse = [{ documents: 'search' }];
  const filteredSearchResult = [{ documents: 'Alfred' }];
  const singleResponse = [{ documents: 'single' }];
  const listResponse = [{ documents: 'list' }];

  beforeEach(() => {
    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}entities`, { body: JSON.stringify({ rows: arrayResponse }) }).
    get(`${_config.APIURL}entities?_id=documentId`, { body: JSON.stringify({ rows: singleResponse }) }).
    get(`${_config.APIURL}documents/search`, { body: JSON.stringify(searchResponse) }).
    get(`${_config.APIURL}documents/list?keys=%5B%221%22%2C%222%22%5D`, { body: JSON.stringify({ rows: listResponse }) }).
    get(`${_config.APIURL}documents/uploads`, { body: JSON.stringify({ rows: 'uploads' }) }).
    get(`${_config.APIURL}documents/count_by_template?templateId=templateId`, { body: JSON.stringify(1) }).
    get(`${_config.APIURL}documents/match_title?searchTerm=term`, { body: JSON.stringify(searchResponse) }).
    get(`${_config.APIURL}documents/search?searchTerm=Batman&joker=true`, { body: JSON.stringify(filteredSearchResult) }).
    delete(`${_config.APIURL}documents?sharedId=shared`, { body: JSON.stringify({ backednResponse: 'testdelete' }) }).
    post(`${_config.APIURL}documents`, { body: JSON.stringify({ backednResponse: 'test' }) });
  });

  afterEach(() => _fetchMock.default.restore());

  describe('uploads', () => {
    it('should request uploads', done => {
      _DocumentsAPI.default.uploads().
      then(response => {
        expect(response).toEqual('uploads');
        done();
      }).
      catch(done.fail);
    });
  });

  describe('get()', () => {
    it('should request documents', done => {
      _DocumentsAPI.default.get().
      then(response => {
        expect(response).toEqual(arrayResponse);
        done();
      }).
      catch(done.fail);
    });

    describe('when passing an id', () => {
      it('should request for the thesauri', done => {
        const requestParams = new _RequestParams.RequestParams({ _id: 'documentId' });
        _DocumentsAPI.default.get(requestParams).
        then(response => {
          expect(response).toEqual(singleResponse);
          done();
        }).
        catch(done.fail);
      });
    });
  });

  describe('list()', () => {
    it('should request documents list', done => {
      const requestParams = new _RequestParams.RequestParams({ keys: ['1', '2'] });
      _DocumentsAPI.default.list(requestParams).
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
      _DocumentsAPI.default.getSuggestions(requestParams).
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
      _DocumentsAPI.default.countByTemplate(requestParams).
      then(response => {
        expect(response).toEqual(1);
        done();
      }).
      catch(done.fail);
    });
  });

  describe('search()', () => {
    it('should search documents', done => {
      _DocumentsAPI.default.search().
      then(response => {
        expect(response).toEqual(searchResponse);
        done();
      }).
      catch(done.fail);
    });

    describe('when passing filters', () => {
      it('should search for it', done => {
        const requestParams = new _RequestParams.RequestParams({ searchTerm: 'Batman', joker: true });
        _DocumentsAPI.default.search(requestParams).
        then(response => {
          expect(response).toEqual(filteredSearchResult);
          done();
        }).
        catch(done.fail);
      });
    });
  });

  describe('save()', () => {
    it('should post the document data to /documents', done => {
      const doc = { name: 'document name' };
      const requestParams = new _RequestParams.RequestParams(doc);
      _DocumentsAPI.default.save(requestParams).
      then(response => {
        expect(JSON.parse(_fetchMock.default.lastOptions(`${_config.APIURL}documents`).body)).toEqual(doc);
        expect(response).toEqual({ backednResponse: 'test' });
        done();
      }).
      catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the document', done => {
      const requestParams = new _RequestParams.RequestParams({ sharedId: 'shared' });
      _DocumentsAPI.default.delete(requestParams).
      then(response => {
        expect(response).toEqual({ backednResponse: 'testdelete' });
        done();
      }).
      catch(done.fail);
    });
  });
});