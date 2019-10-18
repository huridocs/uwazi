"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _api = _interopRequireDefault(require("../utils/api"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  get(requestParams) {
    return _api.default.get('references/by_document', requestParams).
    then(response => response.json);
  },

  getGroupedByConnection(requestParams) {
    return _api.default.get('references/group_by_connection', requestParams).
    then(response => response.json);
  },

  getInbound(requestParams) {
    return _api.default.get('references/by_target/', requestParams).
    then(response => response.json.rows);
  },

  search(requestParams) {
    return _api.default.get('references/search', requestParams).
    then(response => response.json);
  },

  save(requestParams) {
    return _api.default.post('references', requestParams).
    then(response => response.json);
  },

  delete(requestParams) {
    return _api.default.delete('references', requestParams).
    then(response => response.json);
  },

  countByRelationType(requestParams) {
    return _api.default.get('references/count_by_relationtype', requestParams).
    then(response => response.json);
  } };exports.default = _default;