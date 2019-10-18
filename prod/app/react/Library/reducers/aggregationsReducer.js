"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = aggregations;var _BasicReducer = _interopRequireWildcard(require("../../BasicReducer"));
var types = _interopRequireWildcard(require("../actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

const reducer = (0, _BasicReducer.default)('aggregations', {});

function aggregations(state, _action = {}) {
  let action = _action;
  if (action.type === types.INITIALIZE_FILTERS_FORM) {
    action = _BasicReducer.actions.set('aggregations', action.aggregations);
  }

  return reducer(state, action);
}