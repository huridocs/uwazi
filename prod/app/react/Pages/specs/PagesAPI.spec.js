"use strict";var _config = require("../../config.js");
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _RequestParams = require("../../utils/RequestParams");
var _PagesAPI = _interopRequireDefault(require("../PagesAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('pagesAPI', () => {
  const singleResponse = [{ pages: 'single' }];

  async function requestFor(pagesAPIMethod, parameters) {
    const request = new _RequestParams.RequestParams(parameters);
    const response = await pagesAPIMethod(request);
    return response;
  }

  beforeEach(() => {
    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}pages?param=value`, { body: JSON.stringify([singleResponse]) }).
    get(`${_config.APIURL}page?param=id`, { body: JSON.stringify(singleResponse) }).
    post(`${_config.APIURL}pages`, { body: JSON.stringify({ backendResponse: 'post' }) }).
    delete(`${_config.APIURL}pages?sharedId=id`, { body: JSON.stringify({ backendResponse: 'delete' }) });
  });

  afterEach(() => _fetchMock.default.restore());

  describe('get()', () => {
    it('should request for the page', async () => {
      const response = await requestFor(_PagesAPI.default.get, { param: 'value' });
      expect(response).toEqual([singleResponse]);
    });
  });

  describe('getById()', () => {
    it('should request for the page by id', async () => {
      const response = await requestFor(_PagesAPI.default.getById, { param: 'id' });
      expect(response).toEqual(singleResponse);
    });
  });

  describe('save()', () => {
    it('should post the document data to /pages', async () => {
      const response = await requestFor(_PagesAPI.default.save, { title: 'document name' });
      expect(JSON.parse(_fetchMock.default.lastOptions(`${_config.APIURL}pages`).body)).toEqual({ title: 'document name' });
      expect(response).toEqual({ backendResponse: 'post' });
    });
  });

  describe('delete()', () => {
    it('should delete the document', async () => {
      const data = { sharedId: 'id' };
      const response = await requestFor(_PagesAPI.default.delete, data);
      expect(response).toEqual({ backendResponse: 'delete' });
    });
  });
});