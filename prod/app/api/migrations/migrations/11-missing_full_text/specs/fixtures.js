"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  entities: [
  { title: 'test_doc', language: 'es', fullText: 'some full text', file: {} },
  { title: 'test_doc', language: 'pt', file: {} }],

  settings: [
  { _id: _testing_db.default.id(), languages: [{ key: 'es', default: true }, { key: 'pt' }] }] };exports.default = _default;