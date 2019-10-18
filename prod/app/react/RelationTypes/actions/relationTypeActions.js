"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.saveRelationType = saveRelationType;exports.resetRelationType = resetRelationType;var types = _interopRequireWildcard(require("./actionTypes"));
var _RelationTypesAPI = _interopRequireDefault(require("../RelationTypesAPI"));
var _Notifications = require("../../Notifications");
var _I18N = require("../../I18N");
var _RequestParams = require("../../utils/RequestParams");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}


function saveRelationType(relationType) {
  return dispatch => _RelationTypesAPI.default.save(new _RequestParams.RequestParams(relationType)).
  then(() => {
    dispatch({ type: types.RELATION_TYPE_SAVED });
    dispatch(_Notifications.notificationActions.notify((0, _I18N.t)('System', 'RelationType saved', null, false), 'success'));
  });
}

function resetRelationType() {
  return { type: types.RESET_RELATION_TYPE };
}