"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.canNotBeDeleted = exports.against = exports.default = void 0;var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const against = _testing_db.default.id();exports.against = against;
const canNotBeDeleted = _testing_db.default.id();exports.canNotBeDeleted = canNotBeDeleted;var _default =

{
  relationtypes: [
  { _id: against, name: 'Against', properties: [] },
  { _id: _testing_db.default.id(), name: 'Suports', properties: [] },
  { _id: canNotBeDeleted, name: 'Related', properties: [] }],

  connections: [
  { _id: _testing_db.default.id(), title: 'reference1', sourceDocument: 'source1', template: canNotBeDeleted }] };exports.default = _default;