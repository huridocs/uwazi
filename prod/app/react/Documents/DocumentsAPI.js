"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _api = _interopRequireDefault(require("../utils/api"));
var _EntitiesAPI = _interopRequireDefault(require("../Entities/EntitiesAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  get(requestParams) {
    return _EntitiesAPI.default.get(requestParams);
  },

  countByTemplate(requestParams) {
    const url = 'documents/count_by_template';
    return _api.default.get(url, requestParams).
    then(response => response.json);
  },

  uploads() {
    const url = 'documents/uploads';
    return _api.default.get(url).
    then(response => response.json.rows);
  },

  search(requestParams) {
    const url = 'documents/search';
    return _api.default.get(url, requestParams).
    then(response => response.json);
  },

  getSuggestions(requestParams) {
    const url = 'documents/match_title';
    return _api.default.get(url, requestParams).
    then(response => response.json);
  },

  list(requestParams) {
    const url = 'documents/list';
    return _api.default.get(url, requestParams).
    then(response => response.json.rows);
  },

  save(requestParams) {
    return _api.default.post('documents', requestParams).
    then(response => response.json);
  },

  delete(requestParams) {
    return _api.default.delete('documents', requestParams).
    then(response => response.json);
  } };exports.default = _default;