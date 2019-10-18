"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _api = _interopRequireDefault(require("../utils/api"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  get(requestParams) {
    return _api.default.get('translations', requestParams).
    then(response => response.json.rows);
  },

  save(requestParams) {
    return _api.default.post('translations', requestParams).
    then(response => response.json);
  },

  addEntry(requestParams) {
    return _api.default.post('translations/addentry', requestParams).
    then(response => response.json);
  },

  addLanguage(requestParams) {
    return _api.default.post('translations/languages', requestParams).
    then(response => response.json);
  },

  deleteLanguage(requestParams) {
    return _api.default.delete('translations/languages', requestParams).
    then(response => response.json);
  },

  setDefaultLanguage(requestParams) {
    return _api.default.post('translations/setasdeafult', requestParams).
    then(response => response.json);
  } };exports.default = _default;