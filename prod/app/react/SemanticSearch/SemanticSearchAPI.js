"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _api = _interopRequireDefault(require("../utils/api"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  search(requestParams) {
    const url = 'semantic-search';
    return _api.default.post(url, requestParams).
    then(response => response.json);
  },
  getAllSearches(requestParams) {
    const url = 'semantic-search';
    return _api.default.get(url, requestParams).
    then(response => response.json);
  },
  getEntitiesMatchingFilters(requestParams) {
    const url = 'semantic-search/list';
    return _api.default.get(url, requestParams).then(response => response.json);
  },
  getSearch(requestParams) {
    const url = 'semantic-search/';
    return _api.default.get(url, requestParams).then(response => response.json);
  },
  deleteSearch(requestParams) {
    const url = 'semantic-search/';
    return _api.default.delete(url, requestParams).then(response => response.json);
  },
  stopSearch(requestParams) {
    const url = 'semantic-search/stop';
    return _api.default.post(url, requestParams).then(response => response.json);
  },
  resumeSearch(requestParams) {
    const url = 'semantic-search/resume';
    return _api.default.post(url, requestParams).then(response => response.json);
  },
  registerForUpdates(requestParams) {
    const url = 'semantic-search/notify-updates';
    return _api.default.post(url, requestParams).then(response => response.json);
  } };exports.default = _default;