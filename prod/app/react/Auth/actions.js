"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.login = login;exports.recoverPassword = recoverPassword;exports.resetPassword = resetPassword;exports.unlockAccount = unlockAccount;var _api = _interopRequireDefault(require("../utils/api"));
var _BasicReducer = require("../BasicReducer");
var _notificationsActions = require("../Notifications/actions/notificationsActions");
var _RequestParams = require("../utils/RequestParams");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function login(credentials) {
  const request = new _RequestParams.RequestParams(credentials);
  return async dispatch => {
    await _api.default.post('login', request);
    const user = await _api.default.get('user');
    dispatch(_BasicReducer.actions.set('auth/user', user.json));
  };
}

function recoverPassword(email) {
  const request = new _RequestParams.RequestParams({ email });
  return dispatch => _api.default.post('recoverpassword', request).
  then(() => {
    dispatch((0, _notificationsActions.notify)('Instructions to reset your password have been send, please check your email', 'success'));
  });
}

function resetPassword(password, key) {
  const request = new _RequestParams.RequestParams({ password, key });
  return dispatch => _api.default.post('resetpassword', request).
  then(() => {
    dispatch((0, _notificationsActions.notify)('Password changed success', 'success'));
  });
}

function unlockAccount(credentials) {
  const request = new _RequestParams.RequestParams(credentials);
  return dispatch => _api.default.post('unlockaccount', request).
  then(() => {
    dispatch((0, _notificationsActions.notify)('Account unlocked successfully', 'success'));
  });
}