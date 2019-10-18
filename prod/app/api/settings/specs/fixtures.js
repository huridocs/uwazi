"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  settings: [
  {
    _id: _testing_db.default.id(),
    site_name: 'Uwazi',
    publicFormDestination: 'secret.place.io',
    languages: [
    { key: 'es', label: 'Español', default: true },
    { key: 'en', label: 'English' }],

    allowedPublicTemplates: ['id1', 'id2'] }] };exports.default = _default;