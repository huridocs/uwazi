"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.deleteUser = deleteUser;exports.saveUser = saveUser;exports.newUser = newUser;var _BasicReducer = require("../../BasicReducer");
var _Notifications = require("../../Notifications");
var _RequestParams = require("../../utils/RequestParams");
var _UsersAPI = _interopRequireDefault(require("../UsersAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function deleteUser(user) {
  return dispatch => _UsersAPI.default.delete(new _RequestParams.RequestParams(user)).
  then(() => {
    dispatch(_BasicReducer.actions.remove('users', user));
    dispatch(_Notifications.notificationActions.notify('Deleted successfully.', 'success'));
  });
}

function saveUser(user) {
  return dispatch => _UsersAPI.default.save(new _RequestParams.RequestParams(user)).
  then(() => {
    dispatch(_BasicReducer.actions.push('users', user));
    dispatch(_Notifications.notificationActions.notify('Saved successfully.', 'success'));
  });
}

function newUser(user) {
  return dispatch => _UsersAPI.default.new(new _RequestParams.RequestParams(user)).
  then(() => {
    dispatch(_BasicReducer.actions.push('users', user));
    dispatch(_Notifications.notificationActions.notify('Created successfully.', 'success'));
  });
}