"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.openPanel = openPanel;exports.closePanel = closePanel;exports.searching = searching;var types = _interopRequireWildcard(require("./actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

function openPanel(connectionType, sourceDocument) {
  return {
    type: types.OPEN_CONNECTION_PANEL,
    sourceDocument,
    connectionType };

}

function closePanel() {
  return {
    type: types.CLOSE_CONNECTION_PANEL };

}

function searching() {
  return {
    type: types.SEARCHING_CONNECTIONS };

}