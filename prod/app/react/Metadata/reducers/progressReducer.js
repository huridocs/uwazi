"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = documents;var _immutable = _interopRequireDefault(require("immutable"));

var types = _interopRequireWildcard(require("../actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const initialState = {};

function documents(state = initialState, action = {}) {
  if (action.type === types.START_REUPLOAD_DOCUMENT) {
    return state.set(action.doc, 0);
  }

  if (action.type === types.REUPLOAD_PROGRESS) {
    return state.set(action.doc, action.progress);
  }

  if (action.type === types.REUPLOAD_COMPLETE) {
    return state.delete(action.doc);
  }

  return _immutable.default.fromJS(state);
}