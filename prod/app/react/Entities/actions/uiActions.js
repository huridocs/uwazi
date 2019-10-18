"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.showTab = showTab;exports.hideFilters = hideFilters;exports.showFilters = showFilters;var types = _interopRequireWildcard(require("./actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

function showTab(tab) {
  return {
    type: types.SHOW_TAB,
    tab };

}

function hideFilters() {
  return { type: types.HIDE_FILTERS };
}

function showFilters() {
  return { type: types.SHOW_FILTERS };
}