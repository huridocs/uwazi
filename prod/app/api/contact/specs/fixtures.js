"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable max-len */var _default =

{
  settings: [
  { _id: _testing_db.default.id(), languages: [{ key: 'es', default: true }, { key: 'pt' }, { key: 'en' }], contactEmail: 'contact@uwazi.com' }] };exports.default = _default;