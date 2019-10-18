"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = templates;var _immutable = _interopRequireDefault(require("immutable"));

var types = _interopRequireWildcard(require("../actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const initialState = [];

function templates(state = initialState, action = {}) {
  if (action.type === types.SET_TEMPLATES) {
    return _immutable.default.fromJS(action.templates);
  }

  if (action.type === types.DELETE_TEMPLATE) {
    return state.filter(template => template.get('_id') !== action.id);
  }

  return _immutable.default.fromJS(state);
}