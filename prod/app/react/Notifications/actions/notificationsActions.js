"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.removeNotification = removeNotification;exports.notify = notify;var actions = _interopRequireWildcard(require("./actionTypes"));
var _uniqueID = _interopRequireDefault(require("../../../shared/uniqueID"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

function removeNotification(id) {
  return {
    type: actions.REMOVE_NOTIFICATION,
    id };

}

function notify(message, type, delay = 6000) {
  return dispatch => {
    const id = (0, _uniqueID.default)();
    dispatch({ type: actions.NOTIFY, notification: { message, type, id } });
    if (delay) {
      setTimeout(() => {
        dispatch(removeNotification(id));
      }, delay);
    }
    return id;
  };
}