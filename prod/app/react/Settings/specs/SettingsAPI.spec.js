"use strict";var _SettingsAPI = _interopRequireDefault(require("../SettingsAPI"));
var _config = require("../../config.js");
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _jasmineHelpers = require("../../../api/utils/jasmineHelpers");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SettingsAPI', () => {
  beforeEach(() => {
    _fetchMock.default.restore();
    _fetchMock.default.
    post(`${_config.APIURL}settings`, { body: JSON.stringify('ok') }).
    get(`${_config.APIURL}settings`, { body: JSON.stringify({ site_name: 'Uwazi' }) });
  });

  afterEach(() => _fetchMock.default.restore());

  describe('save()', () => {
    let settings;

    beforeEach(() => {
      settings = {
        site_name: 'My name',
        _id: '123' };

    });

    it('should post to users', done => {
      _SettingsAPI.default.save(settings).
      then(response => {
        expect(response).toEqual('ok');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('currentUser()', () => {
    it('should request the logged in user', done => {
      _SettingsAPI.default.get().
      then(response => {
        expect(response).toEqual({ site_name: 'Uwazi' });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });
});