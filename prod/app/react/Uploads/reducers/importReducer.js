"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _BasicReducer = _interopRequireDefault(require("../../BasicReducer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(0, _redux.combineReducers)({
  showImportPanel: (0, _BasicReducer.default)('showImportPanel', false),
  importUploadProgress: (0, _BasicReducer.default)('importUploadProgress', 0),
  importProgress: (0, _BasicReducer.default)('importProgress', 0),
  importStart: (0, _BasicReducer.default)('importStart', false),
  importEnd: (0, _BasicReducer.default)('importEnd', false),
  importError: (0, _BasicReducer.default)('importError', {}) });exports.default = _default;