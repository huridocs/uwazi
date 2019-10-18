"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.loadLinks = loadLinks;exports.addLink = addLink;exports.sortLink = sortLink;exports.removeLink = removeLink;exports.saveLinks = saveLinks;var _reactReduxForm = require("react-redux-form");
var _RequestParams = require("../../utils/RequestParams");

var _BasicReducer = require("../../BasicReducer");
var _uiActions = require("./uiActions");
var _Notifications = require("../../Notifications");

var _uniqueID = _interopRequireDefault(require("../../../shared/uniqueID"));
var _SettingsAPI = _interopRequireDefault(require("../SettingsAPI"));
var types = _interopRequireWildcard(require("./actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function loadLinks(links) {
  return _reactReduxForm.actions.load('settings.navlinksData', { links });
}

function addLink(links) {
  const link = { title: `Item ${links.length + 1}`, localID: (0, _uniqueID.default)() };
  return dispatch => {
    dispatch(_reactReduxForm.actions.push('settings.navlinksData.links', link));
    dispatch((0, _uiActions.editLink)(link.localID));
  };
}

function sortLink(originIndex, targetIndex) {
  return _reactReduxForm.actions.move('settings.navlinksData.links', originIndex, targetIndex);
}

function removeLink(index) {
  return _reactReduxForm.actions.remove('settings.navlinksData.links', index);
}

function saveLinks(data) {
  return dispatch => {
    dispatch({ type: types.SAVING_NAVLINKS });
    return _SettingsAPI.default.save(new _RequestParams.RequestParams(data)).
    then(response => {
      dispatch({ type: types.NAVLINKS_SAVED, data: response });
      dispatch(_BasicReducer.actions.set('settings/collection', response));
      dispatch(_Notifications.notificationActions.notify('Saved successfully.', 'success'));
    }).
    catch(() => {
      dispatch({ type: types.NAVLINKS_SAVED, data });
    });
  };
}