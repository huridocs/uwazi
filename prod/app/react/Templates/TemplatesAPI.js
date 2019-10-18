"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _api = _interopRequireDefault(require("../utils/api"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  get(request) {
    const url = 'templates';
    return _api.default.get(url, request).
    then(response => response.json.rows);
  },

  save(request) {
    return _api.default.post('templates', request).
    then(response => response.json);
  },

  setAsDefault(request) {
    return _api.default.post('templates/setasdefault', request).
    then(response => response.json);
  },

  countByThesauri(request) {
    return _api.default.get('templates/count_by_thesauri', request).
    then(response => response.json);
  },

  delete(request) {
    return _api.default.delete('templates', request).
    then(response => response.json);
  } };exports.default = _default;