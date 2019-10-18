"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.attachmentToDelete = exports.attachmentToEdit = exports.toDeleteId = exports.sharedId = exports.entityIdPt = exports.entityIdEn = exports.entityId = exports.default = void 0;
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable max-len */

const entityId = _testing_db.default.id();exports.entityId = entityId;
const entityIdEn = _testing_db.default.id();exports.entityIdEn = entityIdEn;
const entityIdPt = _testing_db.default.id();exports.entityIdPt = entityIdPt;
const sharedId = 'sharedId';exports.sharedId = sharedId;
const toDeleteId = _testing_db.default.id();exports.toDeleteId = toDeleteId;
const attachmentToDelete = _testing_db.default.id();exports.attachmentToDelete = attachmentToDelete;
const attachmentToEdit = _testing_db.default.id();exports.attachmentToEdit = attachmentToEdit;var _default =

{
  entities: [
  {
    title: 'title',
    sharedId: toDeleteId.toString(),
    _id: toDeleteId,
    file: { originalname: 'source doc', filename: 'mainFile.txt' },
    attachments: [
    { _id: _testing_db.default.id(), filename: 'other.doc' },
    {
      _id: attachmentToDelete,
      filename: 'attachment.txt',
      originalname: 'common name 1.not' }] },



  {
    title: 'title',
    sharedId,
    _id: entityId,
    file: { originalname: 'source doc', filename: 'filename' },
    attachments: [
    { _id: _testing_db.default.id(), originalname: 'o1', filename: 'other.doc' },
    {
      _id: attachmentToEdit,
      filename: 'match.doc',
      originalname: 'common name 2.not' }] },



  {
    title: 'title',
    sharedId,
    _id: entityIdEn,
    file: { originalname: 'source doc', filename: 'filenameEn' },
    attachments: [
    { _id: _testing_db.default.id(), originalname: 'o1', filename: 'otherEn.doc' }] },


  {
    title: 'title',
    sharedId,
    _id: entityIdPt,
    file: { originalname: 'source doc', filename: 'filenamePt' } }] };exports.default = _default;