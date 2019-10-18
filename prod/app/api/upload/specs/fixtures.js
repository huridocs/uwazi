"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.templateId = exports.uploadId = exports.entityEnId = exports.entityId = exports.default = void 0;var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const entityId = _testing_db.default.id();exports.entityId = entityId;
const entityEnId = _testing_db.default.id();exports.entityEnId = entityEnId;
const uploadId = _testing_db.default.id();exports.uploadId = uploadId;
const templateId = _testing_db.default.id();exports.templateId = templateId;var _default =

{
  entities: [
  { _id: entityId, sharedId: 'sharedId1', language: 'es', title: 'Gadgets 01 ES', toc: [{ _id: _testing_db.default.id(), label: 'existingToc' }], file: {} },
  { _id: entityEnId, sharedId: 'sharedId1', language: 'en', title: 'Gadgets 01 EN' }],

  uploads: [
  { _id: uploadId, originalname: 'upload1' },
  { _id: _testing_db.default.id(), originalname: 'upload2' }],

  templates: [
  { _id: templateId, default: true, name: 'mydoc', properties: [] }],

  settings: [
  {
    _id: _testing_db.default.id(),
    languages: [{ key: 'es', default: true }],
    publicFormDestination: 'http://localhost:54321',
    allowedPublicTemplates: [templateId.toString()] }] };exports.default = _default;