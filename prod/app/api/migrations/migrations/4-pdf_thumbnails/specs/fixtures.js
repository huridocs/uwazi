"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.docId4 = exports.docId1 = exports.default = void 0;var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const docId1 = _testing_db.default.id().toString();exports.docId1 = docId1;
const docId4 = _testing_db.default.id().toString();exports.docId4 = docId4;var _default =

{
  entities: [{
    _id: docId1,
    title: 'first doc',
    type: 'document',
    file: {
      filename: 'existingPDF.pdf' } },

  {
    title: 'non document entity',
    type: 'entity' },
  {
    title: 'second doc',
    type: 'document',
    file: {
      filename: 'missingPDF.pdf' } },

  {
    _id: docId4,
    title: 'third doc',
    type: 'document',
    file: {
      filename: 'existingPDF.pdf' } },

  {
    title: 'missconformed doc entity',
    type: 'document' }] };exports.default = _default;