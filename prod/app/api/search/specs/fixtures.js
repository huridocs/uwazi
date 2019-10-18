"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.userId = exports.templateId = exports.syncPropertiesEntityId = exports.unpublishedId = exports.batmanFinishesId = exports.default = void 0;
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable max-len */

const batmanFinishesId = _testing_db.default.id();exports.batmanFinishesId = batmanFinishesId;
const unpublishedId = _testing_db.default.id();exports.unpublishedId = unpublishedId;
const syncPropertiesEntityId = _testing_db.default.id();exports.syncPropertiesEntityId = syncPropertiesEntityId;
const templateId = _testing_db.default.id();exports.templateId = templateId;
const userId = _testing_db.default.id();exports.userId = userId;var _default =

{
  entities: [
  { _id: batmanFinishesId, sharedId: 'shared', template: templateId, language: 'en', title: 'Batman finishes', published: true, user: userId },
  { _id: unpublishedId, sharedId: 'unpublished', template: _testing_db.default.id(), language: 'en', title: 'unpublished', published: false, user: userId },
  { _id: _testing_db.default.id(), sharedId: 'shared', language: 'es', title: 'Penguin almost done', creationDate: 1, published: true },
  {
    _id: _testing_db.default.id(), sharedId: 'shared', language: 'pt', title: 'Penguin almost done', creationDate: 1, published: true, metadata: { text: 'test' } },

  //select/multiselect/date sync
  { _id: syncPropertiesEntityId, template: templateId, sharedId: 'shared1', language: 'en', title: 'EN', published: true, metadata: { text: 'text' } },
  { _id: _testing_db.default.id(), template: templateId, sharedId: 'shared1', language: 'es', title: 'ES', creationDate: 1, published: true, metadata: { text: 'text' } },
  { _id: _testing_db.default.id(), template: templateId, sharedId: 'shared1', language: 'pt', title: 'PT', creationDate: 1, published: true, metadata: { text: 'text' } }],

  settings: [
  { _id: _testing_db.default.id(), languages: [{ key: 'es' }, { key: 'pt' }, { key: 'en' }] }],

  templates: [
  {
    _id: templateId,
    name: 'template_test',
    properties: [
    { type: 'text', name: 'text', filter: true },
    { type: 'select', name: 'select', filter: true },
    { type: 'multiselect', name: 'multiselect', filter: true },
    { type: 'date', name: 'date', filter: true },
    { type: 'multidate', name: 'multidate', filter: true },
    { type: 'multidaterange', name: 'multidaterange', filter: true }] }] };exports.default = _default;