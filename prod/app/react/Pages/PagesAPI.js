"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _api = _interopRequireDefault(require("../utils/api"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  get(requestParams) {
    return _api.default.get('pages', requestParams).
    then(response => response.json);
  },

  getById(requestParams) {
    return _api.default.get('page', requestParams).
    then(response => response.json);
  },

  save(requestParams) {
    return _api.default.post('pages', requestParams).
    then(response => response.json);
  },

  delete(requestParams) {
    return _api.default.delete('pages', requestParams).
    then(response => response.json);
  } };exports.default = _default;