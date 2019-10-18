"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.setSelection = setSelection;exports.setTargetSelection = setTargetSelection;exports.unsetSelection = unsetSelection;exports.unsetTargetSelection = unsetTargetSelection;var types = _interopRequireWildcard(require("./actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

function setSelection(sourceRange) {
  return {
    type: types.SET_SELECTION,
    sourceRange };

}

function setTargetSelection(targetRange) {
  return {
    type: types.SET_TARGET_SELECTION,
    targetRange };

}

function unsetSelection() {
  return {
    type: types.UNSET_SELECTION };

}

function unsetTargetSelection() {
  return {
    type: types.UNSET_TARGET_SELECTION };

}