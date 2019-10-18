"use strict";var _referencesAPI = _interopRequireDefault(require("../referencesAPI"));
var _config = require("../../config.js");
var _RequestParams = require("../../utils/RequestParams");
var _fetchMock = _interopRequireDefault(require("fetch-mock"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('referencesAPI', () => {
  const byDocumentResponse = [{ documents: 'array' }];
  const groupByConnectionResponse = [{ connections: 'array' }];
  const searchResponse = [{ results: 'array' }];
  const searchSortedResponse = [{ results: 'sorted array' }];

  beforeEach(() => {
    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}references/by_document?sharedId=sourceDocument`, { body: JSON.stringify(byDocumentResponse) }).
    get(`${_config.APIURL}references/group_by_connection?sharedId=sourceDocument`, { body: JSON.stringify(groupByConnectionResponse) }).
    get(`${_config.APIURL}references/search?sharedId=sourceDocument`, { body: JSON.stringify(searchResponse) }).
    get(`${_config.APIURL}references/search?sharedId=sourceDocument&sort=title`, { body: JSON.stringify(searchSortedResponse) }).
    get(`${_config.APIURL}references/count_by_relationtype?sharedId=abc1`, { body: '2' }).
    delete(`${_config.APIURL}references?_id=id`, { body: JSON.stringify({ backendResponse: 'testdelete' }) }).
    post(`${_config.APIURL}references`, { body: JSON.stringify({ backednResponse: 'test' }) });
  });

  afterEach(() => _fetchMock.default.restore());

  describe('get()', () => {
    it('should request references', async () => {
      const requestParams = new _RequestParams.RequestParams({ sharedId: 'sourceDocument' });
      const response = await _referencesAPI.default.get(requestParams);
      expect(response).toEqual(byDocumentResponse);
    });
  });

  describe('getGroupedByConnection()', () => {
    it('should request grouped references', done => {
      const requestParams = new _RequestParams.RequestParams({ sharedId: 'sourceDocument' });
      _referencesAPI.default.getGroupedByConnection(requestParams).
      then(response => {
        expect(response).toEqual(groupByConnectionResponse);
        done();
      }).
      catch(done.fail);
    });
  });

  describe('search()', () => {
    it('should search references', done => {
      const requestParams = new _RequestParams.RequestParams({ sharedId: 'sourceDocument' });
      _referencesAPI.default.search(requestParams).
      then(response => {
        expect(response).toEqual(searchResponse);
        done();
      }).
      catch(done.fail);
    });

    it('should search references with additional options', done => {
      const requestParams = new _RequestParams.RequestParams({ sharedId: 'sourceDocument', sort: 'title' });
      _referencesAPI.default.search(requestParams).
      then(response => {
        expect(response).toEqual(searchSortedResponse);
        done();
      }).
      catch(done.fail);
    });
  });

  describe('save()', () => {
    it('should post the document data to /references', done => {
      const data = { name: 'document name' };
      const requestParams = new _RequestParams.RequestParams(data);
      _referencesAPI.default.save(requestParams).
      then(response => {
        expect(JSON.parse(_fetchMock.default.lastOptions(`${_config.APIURL}references`).body)).toEqual(data);
        expect(response).toEqual({ backednResponse: 'test' });
        done();
      }).
      catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the document', done => {
      const requestParams = new _RequestParams.RequestParams({ _id: 'id' });
      _referencesAPI.default.delete(requestParams).
      then(response => {
        expect(response).toEqual({ backendResponse: 'testdelete' });
        done();
      }).
      catch(done.fail);
    });
  });

  describe('countByRelationType()', () => {
    it('should request references', done => {
      const requestParams = new _RequestParams.RequestParams({ sharedId: 'abc1' });
      _referencesAPI.default.countByRelationType(requestParams).
      then(response => {
        expect(response).toEqual(2);
        done();
      }).
      catch(done.fail);
    });
  });
});