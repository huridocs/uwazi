"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  uploads: [
  { _id: _testing_db.default.id(), filename: 'file1.txt' },
  { _id: _testing_db.default.id(), filename: 'file2.txt' },
  { _id: _testing_db.default.id(), filename: 'file3.txt' }] };exports.default = _default;