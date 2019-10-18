"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _api = _interopRequireDefault(require("../utils/api"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  save(requestParams) {
    return _api.default.post('users', requestParams).
    then(response => response.json);
  },

  new(requestParams) {
    return _api.default.post('users/new', requestParams).
    then(response => response.json);
  },

  currentUser(requestParams) {
    return _api.default.get('user', requestParams).
    then(response => response.json);
  },

  get(requestParams) {
    return _api.default.get('users', requestParams).
    then(response => response.json);
  },

  getById(requestParams) {
    return _api.default.get('users', requestParams).
    then(response => response.json[0]);
  },

  delete(requestParams) {
    return _api.default.delete('users', requestParams).
    then(response => response.json);
  } };exports.default = _default;