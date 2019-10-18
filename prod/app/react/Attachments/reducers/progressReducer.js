"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = documents;var _immutable = require("immutable");
var types = _interopRequireWildcard(require("../actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

const initialState = {};

function documents(state = initialState, action = {}) {
  if (action.type === types.START_UPLOAD_ATTACHMENT) {
    return state.set(action.entity, 0);
  }

  if (action.type === types.ATTACHMENT_PROGRESS) {
    return state.set(action.entity, action.progress);
  }

  if (action.type === types.ATTACHMENT_COMPLETE) {
    return state.delete(action.entity);
  }

  return (0, _immutable.fromJS)(state);
}