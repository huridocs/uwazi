"use strict";var _ThesaurisAPI = _interopRequireDefault(require("../ThesaurisAPI"));
var _config = require("../../config.js");
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _RequestParams = require("../../utils/RequestParams");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}


describe('ThesaurisAPI', () => {
  const arrayResponse = [{ thesauris: 'array' }];
  const singleResponse = [{ thesauris: 'single' }];

  beforeEach(() => {
    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}thesauris`, { body: JSON.stringify({ rows: arrayResponse }) }).
    get(`${_config.APIURL}thesauris?_id=thesauriId`, { body: JSON.stringify({ rows: singleResponse }) }).
    delete(`${_config.APIURL}thesauris?_id=id`, { body: JSON.stringify({ backednResponse: 'testdelete' }) }).
    post(`${_config.APIURL}thesauris`, { body: JSON.stringify({ backednResponse: 'test' }) });
  });

  afterEach(() => _fetchMock.default.restore());

  describe('get()', () => {
    it('should request thesauris', done => {
      _ThesaurisAPI.default.get().
      then(response => {
        expect(response).toEqual(arrayResponse);
        done();
      }).
      catch(done.fail);
    });
  });

  describe('save()', () => {
    it('should post the thesauri data to /thesauris', done => {
      const data = { name: 'thesauri name', properties: [] };
      _ThesaurisAPI.default.save(new _RequestParams.RequestParams(data)).
      then(response => {
        expect(JSON.parse(_fetchMock.default.lastOptions(`${_config.APIURL}thesauris`).body)).toEqual(data);
        expect(response).toEqual({ backednResponse: 'test' });
        done();
      }).
      catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the thesauri', done => {
      const data = { _id: 'id' };
      const request = { data };
      _ThesaurisAPI.default.delete(request).
      then(response => {
        expect(response).toEqual({ backednResponse: 'testdelete' });
        done();
      }).
      catch(done.fail);
    });
  });
});