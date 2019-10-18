"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _testing_db = _interopRequireDefault(require("../testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  settings: [
  {
    _id: _testing_db.default.id(),
    site_name: 'Uwazi',
    languages: [
    { key: 'es', default: true },
    { key: 'en' }] }] };exports.default = _default;