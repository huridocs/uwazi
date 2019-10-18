"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.templateId = exports.syncPropertiesEntityId = exports.batmanFinishesId = exports.default = void 0;
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable */

const batmanFinishesId = _testing_db.default.id();exports.batmanFinishesId = batmanFinishesId;
const syncPropertiesEntityId = _testing_db.default.id();exports.syncPropertiesEntityId = syncPropertiesEntityId;
const templateId = _testing_db.default.id();exports.templateId = templateId;
const referenceId = _testing_db.default.id();var _default =

{
  entities: [
  { _id: batmanFinishesId, sharedId: 'shared', template: templateId, language: 'en', title: 'Batman finishes', published: true, user: { username: 'username' }, file: { filename: '8202c463d6158af8065022d9b5014cc1.pdf', originalname: 'Batman original.jpg' } },
  { _id: _testing_db.default.id(), sharedId: 'shared', language: 'es', title: 'Penguin almost done', creationDate: 1, published: true, user: { username: 'username' }, file: { filename: '8202c463d6158af8065022d9b5014ccb.pdf', fullText: 'fullText' }, attachments: [{ filename: '8202c463d6158af8065022d9b5014ccc.pdf' }] },
  {
    _id: _testing_db.default.id(), sharedId: 'shared', language: 'pt', title: 'Penguin almost done', creationDate: 1, published: true, metadata: { text: 'test' },
    user: { username: 'username' } },

  //select/multiselect/date sync
  { _id: syncPropertiesEntityId, template: templateId, sharedId: 'shared1', language: 'en', title: 'EN', published: true, metadata: { text: 'text' }, user: { username: 'username' } },
  { _id: _testing_db.default.id(), template: templateId, sharedId: 'shared1', language: 'es', title: 'ES', creationDate: 1, published: true, metadata: { text: 'text' }, user: { username: 'username' } },
  { _id: _testing_db.default.id(), template: templateId, sharedId: 'shared1', language: 'pt', title: 'PT', creationDate: 1, published: true, metadata: { text: 'text' }, user: { username: 'username' } }],

  settings: [
  { _id: _testing_db.default.id(), languages: [{ key: 'es' }, { key: 'pt' }, { key: 'en' }] }],

  templates: [
  { _id: templateId, name: 'template_test', properties: [
    { type: 'text', name: 'text' },
    { type: 'select', name: 'select' },
    { type: 'multiselect', name: 'multiselect' },
    { type: 'date', name: 'date' },
    { type: 'multidate', name: 'multidate' },
    { type: 'multidaterange', name: 'multidaterange' }] }],



  connections: [
  { _id: referenceId, title: 'reference1', sourceDocument: 'shared', template: 'relation1' },
  { _id: _testing_db.default.id(), title: 'reference2', sourceDocument: 'source2', template: 'relation2', targetDocument: 'shared' },
  { _id: _testing_db.default.id(), title: 'reference3', sourceDocument: 'another', template: 'relation3', targetDocument: 'document' }] };exports.default = _default;