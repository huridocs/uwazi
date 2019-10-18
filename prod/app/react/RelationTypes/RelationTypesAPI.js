"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _api = _interopRequireDefault(require("../utils/api"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  get(request) {
    return _api.default.get('relationtypes', request).
    then(response => response.json.rows);
  },

  save(request) {
    return _api.default.post('relationtypes', request).
    then(response => response.json);
  },

  delete(request) {
    return _api.default.delete('relationtypes', request).
    then(response => response.json);
  } };exports.default = _default;