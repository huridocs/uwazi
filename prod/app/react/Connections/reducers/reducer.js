"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _BasicReducer = _interopRequireDefault(require("../../BasicReducer"));

var _connectionReducer = _interopRequireDefault(require("./connectionReducer"));
var _uiReducer = _interopRequireDefault(require("./uiReducer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(0, _redux.combineReducers)({
  connection: _connectionReducer.default,
  searchResults: (0, _BasicReducer.default)('connections/searchResults', []),
  searchTerm: (0, _BasicReducer.default)('connections/searchTerm', ''),
  uiState: _uiReducer.default });exports.default = _default;