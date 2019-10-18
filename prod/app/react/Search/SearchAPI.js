"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _api = _interopRequireDefault(require("../utils/api"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{

  countByTemplate(requestParams) {
    const url = 'search/count_by_template';
    return _api.default.get(url, requestParams).
    then(response => response.json);
  },

  unpublished() {
    const url = 'search/unpublished';
    return _api.default.get(url).
    then(response => response.json.rows);
  },

  searchSnippets(requestParams) {
    const url = 'search_snippets';
    return _api.default.get(url, requestParams).
    then(response => response.json);
  },

  search(requestParams) {
    return _api.default.get('search', requestParams).
    then(response => response.json);
  },

  getSuggestions(requestParams) {
    const url = 'search/match_title';
    return _api.default.get(url, requestParams).
    then(response => response.json);
  },

  list(requestParams) {
    const url = 'search/list';
    return _api.default.get(url, requestParams).
    then(response => response.json.rows);
  } };exports.default = _default;