"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _api = _interopRequireDefault(require("../utils/api"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  save(settings) {
    return _api.default.post('settings', settings).
    then(response => response.json);
  },

  get(query, headers) {
    return _api.default.get('settings', query, headers).
    then(response => response.json);
  } };exports.default = _default;