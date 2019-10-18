"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.search4Id = exports.search3Id = exports.search2Id = exports.search1Id = exports.default = void 0;var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const search1Id = _testing_db.default.id();exports.search1Id = search1Id;
const search2Id = _testing_db.default.id();exports.search2Id = search2Id;
const search3Id = _testing_db.default.id();exports.search3Id = search3Id;
const search4Id = _testing_db.default.id();exports.search4Id = search4Id;var _default =

{
  semanticsearches: [
  { _id: search1Id, status: 'inProgress' },
  { _id: search2Id, status: 'inProgress' },
  { _id: search3Id, status: 'pending' },
  { _id: _testing_db.default.id(), status: 'completed' },
  { _id: search4Id, status: 'inProgress' }] };exports.default = _default;