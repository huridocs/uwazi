"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _api = _interopRequireDefault(require("../utils/api"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  get(requestParams) {
    return _api.default.
    get('entities', requestParams).
    then(response => response.json.rows);
  },

  countByTemplate(requestParams) {
    const url = 'entities/count_by_template';
    return _api.default.get(url, requestParams).then(response => response.json);
  },

  async getRawPage(requestParams) {
    const response = await _api.default.get(
    'entities/get_raw_page',
    requestParams.add({ pageNumber: requestParams.data.pageNumber || 1 }));

    return response.json.data;
  },

  uploads() {
    const url = 'entities/uploads';
    return _api.default.get(url).then(response => response.json.rows);
  },

  search(requestParams) {
    const url = 'entities/search';
    return _api.default.get(url, requestParams).then(response => response.json);
  },

  getSuggestions(requestParams) {
    const url = 'entities/match_title';
    return _api.default.get(url, requestParams).then(response => response.json);
  },

  save(requestParams) {
    return _api.default.post('entities', requestParams).then(response => response.json);
  },

  multipleUpdate(requestParams) {
    return _api.default.
    post('entities/multipleupdate', requestParams).
    then(response => response.json);
  },

  delete(requestParams) {
    return _api.default.
    delete('entities', requestParams).
    then(response => response.json);
  },

  deleteMultiple(requestParams) {
    return _api.default.
    post('entities/bulkdelete', requestParams).
    then(response => response.json);
  } };exports.default = _default;