"use strict";var _RelationTypesAPI = _interopRequireDefault(require("../RelationTypesAPI"));
var _config = require("../../config.js");
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _RequestParams = require("../../utils/RequestParams");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('RelationTypesAPI', () => {
  const arrayResponse = [{ name: 'test' }, { name: 'test2' }];

  beforeEach(() => {
    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}relationtypes?param=value`, { body: JSON.stringify({ rows: arrayResponse }) }).
    delete(`${_config.APIURL}relationtypes?_id=id`, { body: JSON.stringify({ backednResponse: 'testdelete' }) }).
    post(`${_config.APIURL}relationtypes`, { body: JSON.stringify({ backednResponse: 'test' }) });
  });

  afterEach(() => _fetchMock.default.restore());

  describe('get()', () => {
    it('should request relationTypes', async () => {
      const response = await _RelationTypesAPI.default.get(new _RequestParams.RequestParams({ param: 'value' }));
      expect(response).toEqual(arrayResponse);
    });
  });

  describe('save()', () => {
    it('should post the thesauri data to /relationTypes', async () => {
      const data = { name: 'thesauri name', properties: [] };
      const response = await _RelationTypesAPI.default.save(new _RequestParams.RequestParams(data));
      expect(JSON.parse(_fetchMock.default.lastOptions(`${_config.APIURL}relationtypes`).body)).toEqual(data);
      expect(response).toEqual({ backednResponse: 'test' });
    });
  });

  describe('delete()', () => {
    it('should delete the thesauri', async () => {
      const response = await _RelationTypesAPI.default.delete(new _RequestParams.RequestParams({ _id: 'id' }));
      expect(response).toEqual({ backednResponse: 'testdelete' });
    });
  });
});