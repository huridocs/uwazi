"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.docId2 = exports.docId1 = exports.templateWithEntityAsThesauri = exports.templateChangingNames = exports.templateId = exports.syncPropertiesEntityId = exports.batmanFinishesId = exports.default = void 0;
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable max-len */

const batmanFinishesId = _testing_db.default.id();exports.batmanFinishesId = batmanFinishesId;
const syncPropertiesEntityId = _testing_db.default.id();exports.syncPropertiesEntityId = syncPropertiesEntityId;
const templateId = _testing_db.default.id();exports.templateId = templateId;
const templateChangingNames = _testing_db.default.id();exports.templateChangingNames = templateChangingNames;
const referenceId = _testing_db.default.id();
const templateWithEntityAsThesauri = _testing_db.default.id();exports.templateWithEntityAsThesauri = templateWithEntityAsThesauri;
const templateWithEntityAsThesauri2 = _testing_db.default.id();
const templateWithOnlySelect = _testing_db.default.id();
const templateWithOnlyMultiselect = _testing_db.default.id();

const hub1 = _testing_db.default.id();
const hub2 = _testing_db.default.id();
const hub3 = _testing_db.default.id();
const hub4 = _testing_db.default.id();
const hub5 = _testing_db.default.id();

const docId1 = _testing_db.default.id();exports.docId1 = docId1;
const docId2 = _testing_db.default.id();exports.docId2 = docId2;var _default =

{
  entities: [
  {
    _id: batmanFinishesId,
    sharedId: 'shared',
    type: 'entity',
    template: templateId,
    language: 'en',
    title: 'Batman finishes',
    published: true,
    fullText: {
      1: 'page[[1]] 1[[1]]',
      2: 'page[[2]] 2[[2]]',
      3: '' },

    metadata: {
      property1: 'value1' },

    file: {
      filename: '8202c463d6158af8065022d9b5014cc1.pdf' } },


  { _id: docId1, sharedId: 'shared', type: 'entity', language: 'es', title: 'Penguin almost done', creationDate: 1, published: true, file: { filename: '8202c463d6158af8065022d9b5014ccb.pdf' }, attachments: [{ filename: '8202c463d6158af8065022d9b5014ccc.pdf' }], fullText: { 1: 'text' } },
  { _id: docId2, sharedId: 'shared', type: 'entity', language: 'pt', title: 'Penguin almost done', creationDate: 1, published: true, metadata: { text: 'test' }, file: { filename: '8202c463d6158af8065022d9b5014cc1.pdf' } },
  { _id: _testing_db.default.id(), sharedId: 'other', type: 'entity', template: templateId, language: 'en', title: 'Unpublished entity', published: false, metadata: { property1: 'value1' } },
  //select/multiselect/date sync
  { _id: syncPropertiesEntityId, template: templateId, sharedId: 'shared1', type: 'entity', language: 'en', title: 'EN', published: true, metadata: { property1: 'text' }, file: { filename: 'nonexistent.pdf' } },
  { _id: _testing_db.default.id(), template: templateId, sharedId: 'shared1', type: 'entity', language: 'es', title: 'ES', creationDate: 1, published: true, metadata: { property1: 'text' }, file: { filename: 'nonexistent.pdf' }, fullText: { 1: 'text' } },
  { _id: _testing_db.default.id(), template: templateId, sharedId: 'shared1', type: 'entity', language: 'pt', title: 'PT', creationDate: 1, published: true, metadata: { property1: 'text' }, file: { filename: 'nonexistent.pdf' } },
  //docs to change metadata property names
  { _id: _testing_db.default.id(), template: templateChangingNames, sharedId: 'shared10', type: 'entity', language: 'pt', title: 'PT', creationDate: 1, published: true, metadata: { property1: 'value1', property2: 'value2', property3: 'value3' }, file: { filename: '123.pdf' } },
  { _id: _testing_db.default.id(), template: templateChangingNames, sharedId: 'shared10', type: 'entity', language: 'pt', title: 'PT', creationDate: 1, published: true, metadata: { property1: 'value1', property2: 'value2', property3: 'value3' }, file: { filename: '123.pdf' } },
  //docs using entity as thesauri
  { title: 'title', _id: _testing_db.default.id(), template: templateWithEntityAsThesauri, sharedId: 'multiselect', type: 'entity', language: 'en', metadata: { multiselect: ['shared', 'value1'] }, file: { filename: '123.pdf' } },
  { title: 'title', _id: _testing_db.default.id(), template: templateWithEntityAsThesauri2, sharedId: 'multiselect', type: 'entity', language: 'es', metadata: { multiselect2: ['shared', 'value2'] }, file: { filename: '123.pdf' }, fullText: { 1: 'text' } },
  { title: 'title', _id: _testing_db.default.id(), template: templateWithEntityAsThesauri, sharedId: 'select', type: 'entity', language: 'en', metadata: { select: 'shared' }, file: { filename: '123.pdf' } },
  { title: 'title', _id: _testing_db.default.id(), template: templateWithEntityAsThesauri2, sharedId: 'select', type: 'entity', language: 'es', metadata: { select2: 'shared' }, file: { filename: '123.pdf' }, fullText: { 1: 'text' } },
  { title: 'title', _id: _testing_db.default.id(), template: _testing_db.default.id(), sharedId: 'otherTemplateWithMultiselect', type: 'entity', language: 'es', metadata: { select2: 'value' }, file: { filename: '123.pdf' }, fullText: { 1: 'text' } },
  { title: 'title', _id: _testing_db.default.id(), template: templateWithOnlySelect, sharedId: 'otherTemplateWithSelect', type: 'entity', language: 'es', metadata: { select: 'shared10' }, file: { filename: '123.pdf' }, fullText: { 1: 'text' } },
  { title: 'title', _id: _testing_db.default.id(), template: templateWithOnlyMultiselect, sharedId: 'otherTemplateWithMultiselect', type: 'entity', language: 'es', metadata: { multiselect: ['value1', 'multiselect'] }, file: { filename: '123.pdf' } },
  { sharedId: 'shared2', language: 'en' },
  { sharedId: 'source2', language: 'en' }],

  settings: [
  { _id: _testing_db.default.id(), languages: [{ key: 'es', default: true }, { key: 'pt' }, { key: 'en' }] }],

  templates: [
  { _id: templateId,
    name: 'template_test',
    properties: [
    { type: 'text', name: 'text' },
    { type: 'select', name: 'select' },
    { type: 'multiselect', name: 'multiselect' },
    { type: 'date', name: 'date' },
    { type: 'multidate', name: 'multidate' },
    { type: 'multidaterange', name: 'multidaterange' },
    { type: 'daterange', name: 'daterange' },
    { type: 'relationship', name: 'friends', relationType: 'relation1' },
    { type: 'numeric', name: 'numeric' }] },

  { _id: templateWithOnlyMultiselect,
    name: 'templateWithOnlyMultiSelectSelect',
    properties: [
    { type: 'multiselect', name: 'multiselect', content: templateWithEntityAsThesauri.toString() }] },

  { _id: templateWithOnlySelect,
    name: 'templateWithOnlySelect',
    properties: [
    { type: 'select', name: 'select', content: templateChangingNames.toString() }] },

  { _id: templateWithEntityAsThesauri,
    name: 'template_with_thesauri_as_template',
    properties: [
    { type: 'select', name: 'select', content: templateId.toString() },
    { type: 'multiselect', name: 'multiselect', content: templateId.toString() }] },

  { _id: templateWithEntityAsThesauri2,
    name: 'template_with_thesauri_as_template',
    properties: [
    { type: 'select', name: 'select2', content: templateId.toString() },
    { type: 'multiselect', name: 'multiselect2', content: templateId.toString() }] },

  { _id: templateChangingNames,
    name: 'template_changing_names',
    default: true,
    properties: [
    { id: '1', type: 'text', name: 'property1' },
    { id: '2', type: 'text', name: 'property2' },
    { id: '3', type: 'text', name: 'property3' }] }],


  connections: [
  { _id: referenceId, entity: 'shared', template: null, hub: hub1 },
  { entity: 'shared2', template: 'relation1', hub: hub1 },
  { entity: 'shared', template: null, hub: hub2 },
  { entity: 'source2', template: 'relation2', hub: hub2 },
  { entity: 'another', template: 'relation3', hub: hub3 },
  { entity: 'document', template: 'relation3', hub: hub3 },
  { entity: 'shared', template: 'relation2', hub: hub4 },
  { entity: 'shared1', template: 'relation2', hub: hub4 },
  { entity: 'shared1', template: 'relation2', hub: hub5 },
  { entity: 'shared', template: 'relation2', hub: hub5 }] };exports.default = _default;