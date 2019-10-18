"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.pageToUpdate = exports.default = void 0;var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const pageToUpdate = _testing_db.default.id();exports.pageToUpdate = pageToUpdate;var _default =

{
  pages: [
  { _id: _testing_db.default.id(), sharedId: '1', language: 'es', title: 'Batman finishes', user: { username: 'user' } },
  { _id: _testing_db.default.id(), sharedId: '1', language: 'en', title: 'Batman finishes', user: { username: 'user' } },
  { _id: pageToUpdate, sharedId: '2', language: 'es', title: 'Penguin almost done', creationDate: 1, user: { username: 'user' } },
  { _id: _testing_db.default.id(), sharedId: '2', language: 'fr', title: 'Right there', user: { username: 'user' } }],


  settings: [
  { _id: _testing_db.default.id(), languages: [{ key: 'es', default: true }, { key: 'pt' }, { key: 'en' }] }] };exports.default = _default;