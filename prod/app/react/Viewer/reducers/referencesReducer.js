"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = referencesReducer;var _immutable = _interopRequireDefault(require("immutable"));
var types = _interopRequireWildcard(require("../actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const initialState = [];

function referencesReducer(state = initialState, action = {}) {
  if (action.type === types.SET_REFERENCES) {
    return _immutable.default.fromJS(action.references);
  }

  if (action.type === types.RESET_DOCUMENT_VIEWER) {
    return _immutable.default.fromJS(initialState);
  }

  if (action.type === types.ADD_REFERENCE) {
    return state.push(_immutable.default.fromJS(action.reference));
  }

  if (action.type === types.REMOVE_REFERENCE) {
    const hubRelationships = state.filter(r => r.get('hub') === action.reference.hub);
    if (hubRelationships.size <= 2) {
      return state.filter(r => r.get('hub') !== action.reference.hub);
    }

    return state.filter(r => r.get('_id') !== action.reference.associatedRelationship._id);
  }

  return _immutable.default.fromJS(state);
}