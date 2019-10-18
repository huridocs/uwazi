"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = filters;var _immutable = _interopRequireDefault(require("immutable"));

var types = _interopRequireWildcard(require("../actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const initialState = { properties: [], documentTypes: [] };

function filters(state = initialState, action = {}) {
  if (action.type === types.SET_LIBRARY_FILTERS || action.type === types.INITIALIZE_FILTERS_FORM) {
    return state.set('documentTypes', _immutable.default.fromJS(action.documentTypes)).
    set('properties', _immutable.default.fromJS(action.libraryFilters));
  }

  if (action.type === types.UPDATE_LIBRARY_FILTERS) {
    return state.set('properties', _immutable.default.fromJS(action.libraryFilters));
  }

  return _immutable.default.fromJS(state);
}