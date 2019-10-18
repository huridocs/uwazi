"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _BasicReducer = _interopRequireDefault(require("../BasicReducer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(0, _redux.combineReducers)({
  search: (0, _BasicReducer.default)('activitylog/search', {}),
  list: (0, _BasicReducer.default)('activitylog/list', []) });exports.default = _default;