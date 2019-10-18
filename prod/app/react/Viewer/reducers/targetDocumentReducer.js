"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = targetDocumentReducer;var types = _interopRequireWildcard(require("../actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

const initialState = { pages: [], css: [] };

function targetDocumentReducer(state = initialState, action = {}) {
  if (action.type === types.SET_TARGET_DOCUMENT) {
    return Object.assign({}, action.html, action.document);
  }

  if (action.type === types.ADD_REFERENCE) {
    return initialState;
  }

  return state;
}