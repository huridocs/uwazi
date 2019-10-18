"use strict";var _reactRouter = require("react-router");
var _RequestParams = require("../RequestParams");

var _config = require("../../config");
var _store = require("../../store");
var _api = _interopRequireDefault(require("../api"));
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _LoadingProgressBar = _interopRequireDefault(require("../../App/LoadingProgressBar"));
var notifyActions = _interopRequireWildcard(require("../../Notifications/actions/notificationsActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('api', () => {
  beforeEach(() => {
    spyOn(_LoadingProgressBar.default, 'start');
    spyOn(_LoadingProgressBar.default, 'done');
    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}test_get`, JSON.stringify({ method: 'GET' })).
    get(`${_config.APIURL}test_get?key=value`, JSON.stringify({ method: 'GET' })).
    post(`${_config.APIURL}test_post`, JSON.stringify({ method: 'POST' })).
    delete(`${_config.APIURL}test_delete?data=delete`, JSON.stringify({ method: 'DELETE' })).
    get(`${_config.APIURL}unauthorised`, { status: 401, body: {} }).
    get(`${_config.APIURL}notfound`, { status: 404, body: {} }).
    get(`${_config.APIURL}error_url`, { status: 500, body: {} });
  });

  afterEach(() => _fetchMock.default.restore());

  describe('GET', () => {
    it('should prefix url with config api url', async () => {
      const response = await _api.default.get('test_get');
      expect(response.json.method).toBe('GET');
    });

    it('should start and end the loading bar', async () => {
      await _api.default.get('test_get');
      expect(_LoadingProgressBar.default.done).toHaveBeenCalled();
      expect(_LoadingProgressBar.default.start).toHaveBeenCalled();
    });

    it('should add headers and data as query string', async () => {
      const requestParams = new _RequestParams.RequestParams({ key: 'value' }, { header: 'value', header2: 'value2' });
      await _api.default.get('test_get', requestParams);

      expect(_fetchMock.default.calls()[0][1].headers.header).toBe('value');
      expect(_fetchMock.default.calls()[0][1].headers.header2).toBe('value2');
    });
  });

  describe('POST', () => {
    it('should prefix url with config api url', async () => {
      const requestParams = new _RequestParams.RequestParams({ key: 'value' }, { header: 'value', header2: 'value2' });
      const response = await _api.default.post('test_post', requestParams);

      expect(_fetchMock.default.calls()[0][1].body).toBe(JSON.stringify({ key: 'value' }));
      expect(_fetchMock.default.calls()[0][1].headers.header).toBe('value');
      expect(_fetchMock.default.calls()[0][1].headers.header2).toBe('value2');
      expect(response.json.method).toBe('POST');
    });

    it('should start and end the loading bar', async () => {
      const promise = _api.default.post('test_post', {});
      expect(_LoadingProgressBar.default.start).toHaveBeenCalled();

      await promise;
      expect(_LoadingProgressBar.default.done).toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    it('should prefix url with config api url', async () => {
      const requestParams = new _RequestParams.RequestParams({ data: 'delete' }, { header: 'value', header2: 'value2' });
      const response = await _api.default.delete('test_delete', requestParams);

      expect(response.json.method).toBe('DELETE');
      expect(_fetchMock.default.calls()[0][1].headers.header).toBe('value');
      expect(_fetchMock.default.calls()[0][1].headers.header2).toBe('value2');
    });

    it('should start and end the loading bar', async () => {
      const requestParams = new _RequestParams.RequestParams({ data: 'delete' }, { header: 'value', header2: 'value2' });
      const promise = _api.default.delete('test_delete', requestParams);
      expect(_LoadingProgressBar.default.start).toHaveBeenCalled();

      await promise;
      expect(_LoadingProgressBar.default.done).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    describe('401', () => {
      it('should redirect to login', done => {
        spyOn(_reactRouter.browserHistory, 'replace');
        _api.default.get('unauthorised').
        catch(() => {
          expect(_reactRouter.browserHistory.replace).toHaveBeenCalledWith('/login');
          done();
        });
      });
    });

    describe('404', () => {
      it('should redirect to login', done => {
        spyOn(_reactRouter.browserHistory, 'replace');
        _api.default.get('notfound').
        catch(() => {
          expect(_reactRouter.browserHistory.replace).toHaveBeenCalledWith('/404');
          done();
        });
      });
    });

    it('should notify the user', done => {
      spyOn(_store.store, 'dispatch');
      spyOn(notifyActions, 'notify').and.returnValue('notify action');
      _api.default.get('error_url').
      catch(() => {
        expect(_store.store.dispatch).toHaveBeenCalledWith('notify action');
        expect(notifyActions.notify).toHaveBeenCalledWith('An error has occurred', 'danger');
        done();
      });
    });

    it('should end the loading bar', done => {
      _api.default.get('error_url').
      catch(() => {
        expect(_LoadingProgressBar.default.done).toHaveBeenCalled();
        done();
      });
    });
  });
});