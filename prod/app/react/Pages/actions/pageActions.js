"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.resetPage = resetPage;exports.savePage = savePage;exports.deletePage = deletePage;var _reactRouter = require("react-router");
var _reactReduxForm = require("react-redux-form");
var _RequestParams = require("../../utils/RequestParams");

var _BasicReducer = require("../../BasicReducer");
var _Notifications = require("../../Notifications");
var _PagesAPI = _interopRequireDefault(require("../PagesAPI"));
var types = _interopRequireWildcard(require("./actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function resetPage() {
  return dispatch => {
    dispatch(_reactReduxForm.actions.reset('page.data'));
    dispatch(_reactReduxForm.actions.setInitial('page.data'));
  };
}

function savePage(data) {
  return dispatch => {
    dispatch({ type: types.SAVING_PAGE });
    return _PagesAPI.default.save(new _RequestParams.RequestParams(data)).
    then(response => {
      dispatch(_Notifications.notificationActions.notify('Saved successfully.', 'success'));
      dispatch(_reactReduxForm.actions.merge('page.data', { _id: response._id, sharedId: response.sharedId, _rev: response._rev }));
      dispatch({ type: types.PAGE_SAVED, data: response });
      _reactRouter.browserHistory.push(`/settings/pages/edit/${response.sharedId}`);
    }).
    catch(() => {
      dispatch({ type: types.PAGE_SAVED, data: {} });
    });
  };
}

function deletePage(page) {
  return dispatch => _PagesAPI.default.delete(new _RequestParams.RequestParams({ sharedId: page.sharedId })).
  then(() => {
    dispatch(_BasicReducer.actions.remove('pages', page));
  });
}