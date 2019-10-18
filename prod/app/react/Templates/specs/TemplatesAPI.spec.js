"use strict";var _TemplatesAPI = _interopRequireDefault(require("../TemplatesAPI"));
var _config = require("../../config.js");
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _RequestParams = require("../../utils/RequestParams");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('TemplatesAPI', () => {
  const mockResponse = [{ templates: 'array' }];
  const templateResponse = [{ template: 'single' }];

  beforeEach(() => {
    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}templates`, { body: JSON.stringify({ rows: mockResponse }) }).
    get(`${_config.APIURL}templates/count_by_thesauri?_id=id`, { body: JSON.stringify({ total: 1 }) }).
    get(`${_config.APIURL}templates?_id=templateId`, { body: JSON.stringify({ rows: templateResponse }) }).
    delete(`${_config.APIURL}templates?_id=id`, { body: JSON.stringify({ backednResponse: 'testdelete' }) }).
    post(`${_config.APIURL}templates`, { body: JSON.stringify({ backednResponse: 'test' }) });
  });

  afterEach(() => _fetchMock.default.restore());

  describe('get()', () => {
    it('should request templates', async () => {
      const response = await _TemplatesAPI.default.get();
      expect(response).toEqual(mockResponse);
    });

    describe('when passing an id', () => {
      it('should request for the template', async () => {
        const response = await _TemplatesAPI.default.get(new _RequestParams.RequestParams({ _id: 'templateId' }));
        expect(response).toEqual(templateResponse);
      });
    });
  });

  describe('save()', () => {
    it('should post the template data to /templates', async () => {
      const data = { name: 'template name', properties: [] };
      const response = await _TemplatesAPI.default.save(new _RequestParams.RequestParams(data));
      expect(JSON.parse(_fetchMock.default.lastOptions(`${_config.APIURL}templates`).body)).toEqual(data);
      expect(response).toEqual({ backednResponse: 'test' });
    });
  });

  describe('delete()', () => {
    it('should delete the template', async () => {
      const data = { _id: 'id' };
      const response = await _TemplatesAPI.default.delete(new _RequestParams.RequestParams(data));
      expect(response).toEqual({ backednResponse: 'testdelete' });
    });
  });

  describe('countByThesauri()', () => {
    it('should request the templates using a specific thesauri', async () => {
      const data = { _id: 'id' };
      const request = { data };
      const response = await _TemplatesAPI.default.countByThesauri(request);
      expect(response).toEqual({ total: 1 });
    });
  });
});