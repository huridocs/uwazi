"use strict";var _reduxMockStore = _interopRequireDefault(require("redux-mock-store"));
var _reduxThunk = _interopRequireDefault(require("redux-thunk"));
var _fetchMock = _interopRequireDefault(require("fetch-mock"));

var _config = require("../../config.js");
var notifications = _interopRequireWildcard(require("../../Notifications/actions/notificationsActions"));
var actions = _interopRequireWildcard(require("../actions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const middlewares = [_reduxThunk.default];
const mockStore = (0, _reduxMockStore.default)(middlewares);

describe('auth actions', () => {
  beforeEach(() => {
    _fetchMock.default.restore();
    _fetchMock.default.
    post(`${_config.APIURL}login`, { body: JSON.stringify({ success: true }) }).
    post(`${_config.APIURL}recoverpassword`, { body: JSON.stringify({ success: true }) }).
    post(`${_config.APIURL}resetpassword`, { body: JSON.stringify({ success: true }) }).
    post(`${_config.APIURL}unlockaccount`, { body: JSON.stringify({ success: true }) }).
    get(`${_config.APIURL}user`, { body: JSON.stringify({ username: 'username' }) });
  });

  afterEach(() => _fetchMock.default.restore());

  describe('login', () => {
    describe('when success', () => {
      it('should login, fetch user loged and store it in the state', done => {
        const expectedActions = [
        { type: 'auth/user/SET', value: { username: 'username' } }];


        const store = mockStore({});

        const credentials = { username: 'username' };
        store.dispatch(actions.login(credentials)).
        then(() => {
          expect(_fetchMock.default.calls(`${_config.APIURL}login`)[0][1].body).toEqual(JSON.stringify(credentials));
          expect(store.getActions()).toEqual(expectedActions);
        }).
        then(done).
        catch(done.fail);
      });
    });
  });

  describe('recoverPassword', () => {
    it('should post to recoverPassword with the email', done => {
      spyOn(notifications, 'notify');
      actions.recoverPassword('email@forgot.com')(jasmine.createSpy('dispatch')).
      then(() => {
        expect(_fetchMock.default.calls(`${_config.APIURL}recoverpassword`)[0][1].body).toEqual(JSON.stringify({ email: 'email@forgot.com' }));
        expect(notifications.notify).toHaveBeenCalled();
        done();
      }).
      catch(done.fail);
    });
  });

  describe('resetPassword', () => {
    it('should post to resetPassword with new password and the key', done => {
      spyOn(notifications, 'notify');
      actions.resetPassword('asd123', 'uniqueKey')(jasmine.createSpy('dispatch')).
      then(() => {
        expect(_fetchMock.default.calls(`${_config.APIURL}resetpassword`)[0][1].body).toEqual(JSON.stringify({ password: 'asd123', key: 'uniqueKey' }));
        expect(notifications.notify).toHaveBeenCalled();
        done();
      }).
      catch(done.fail);
    });
  });

  describe('unlockAccount', () => {
    it('should post to unlockaccount with username and code', done => {
      spyOn(notifications, 'notify');
      const creds = { username: 'username', code: 'code' };
      actions.unlockAccount(creds)(jasmine.createSpy('dispatch')).
      then(() => {
        expect(_fetchMock.default.calls(`${_config.APIURL}unlockaccount`)[0][1].body).toEqual(JSON.stringify(creds));
        expect(notifications.notify).toHaveBeenCalled();
        done();
      }).
      catch(done.fail);
    });
  });
});