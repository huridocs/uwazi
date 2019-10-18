"use strict";var _config = require("../../config.js");
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _RequestParams = require("../../utils/RequestParams");
var _I18NApi = _interopRequireDefault(require("../I18NApi"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('I18NApi', () => {
  const translations = [{ locale: 'es' }, { locale: 'en' }];
  const translation = { locale: 'es' };
  const okResponse = 'ok';

  beforeEach(() => {
    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}translations`, { body: JSON.stringify({ rows: translations }) }).
    post(`${_config.APIURL}translations`, { body: JSON.stringify(translation) }).
    post(`${_config.APIURL}translations/addentry`, { body: JSON.stringify(okResponse) }).
    post(`${_config.APIURL}translations/languages`, { body: JSON.stringify(okResponse) }).
    delete(`${_config.APIURL}translations/languages?key=kl`, { body: JSON.stringify(okResponse) }).
    post(`${_config.APIURL}translations/setasdeafult`, { body: JSON.stringify(okResponse) });
  });

  afterEach(() => _fetchMock.default.restore());

  describe('get()', () => {
    it('should request translations', done => {
      _I18NApi.default.get().
      then(response => {
        expect(response).toEqual(translations);
        done();
      }).
      catch(done.fail);
    });
  });

  describe('save()', () => {
    it('should post the document data to translations', done => {
      const requestParams = new _RequestParams.RequestParams({ locale: 'fr' });
      _I18NApi.default.save(requestParams).
      then(response => {
        expect(JSON.parse(_fetchMock.default.lastOptions(`${_config.APIURL}translations`).body)).toEqual({ locale: 'fr' });
        expect(response).toEqual(translation);
        done();
      }).
      catch(done.fail);
    });
  });

  describe('addEntry()', () => {
    it('should post the new entry translations', done => {
      const data = { context: 'System', key: 'search', value: 'Buscar' };
      const requestParams = new _RequestParams.RequestParams(data);
      _I18NApi.default.addEntry(requestParams).
      then(response => {
        expect(JSON.parse(_fetchMock.default.lastOptions(`${_config.APIURL}translations/addentry`).body)).
        toEqual(data);

        expect(response).toEqual('ok');
        done();
      }).
      catch(done.fail);
    });
  });

  describe('addLanguage()', () => {
    it('should post the new language', done => {
      const data = { label: 'Klingon', key: 'kl' };
      const requestParams = new _RequestParams.RequestParams(data);
      _I18NApi.default.addLanguage(requestParams).
      then(response => {
        expect(JSON.parse(_fetchMock.default.lastOptions(`${_config.APIURL}translations/languages`).body)).
        toEqual(data);

        expect(response).toEqual('ok');
        done();
      }).
      catch(done.fail);
    });
  });

  describe('deleteLanguage()', () => {
    it('should delete languages', done => {
      const requestParams = new _RequestParams.RequestParams({ key: 'kl' });
      _I18NApi.default.deleteLanguage(requestParams).
      then(response => {
        expect(response).toEqual('ok');
        done();
      }).
      catch(done.fail);
    });
  });

  describe('setDefaultLanguage()', () => {
    it('should post the default language', done => {
      const requestParams = new _RequestParams.RequestParams({ key: 'kl' });
      _I18NApi.default.setDefaultLanguage(requestParams).
      then(response => {
        expect(JSON.parse(_fetchMock.default.lastOptions(`${_config.APIURL}translations/setasdeafult`).body)).
        toEqual({ key: 'kl' });

        expect(response).toEqual('ok');
        done();
      }).
      catch(done.fail);
    });
  });
});