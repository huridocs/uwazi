"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.sharedId7 = exports.sharedId4 = exports.sharedId3 = exports.sharedId2 = exports.friend = exports.family = exports.hub12 = exports.hub11 = exports.hub10 = exports.hub9 = exports.hub8 = exports.hub7 = exports.hub6 = exports.hub5 = exports.hub4 = exports.hub3 = exports.hub2 = exports.hub1 = exports.relation2 = exports.relation1 = exports.templateWithoutProperties = exports.templateChangingNames = exports.value2ID = exports.value1ID = exports.selectValueID = exports.entity3 = exports.connectionID9 = exports.connectionID8 = exports.connectionID7 = exports.connectionID6 = exports.connectionID5 = exports.connectionID4 = exports.connectionID3 = exports.connectionID2 = exports.connectionID1 = exports.inbound = exports.template = exports.default = void 0;
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable */
const connectionID1 = _testing_db.default.id();exports.connectionID1 = connectionID1;
const connectionID2 = _testing_db.default.id();exports.connectionID2 = connectionID2;
const connectionID3 = _testing_db.default.id();exports.connectionID3 = connectionID3;
const connectionID4 = _testing_db.default.id();exports.connectionID4 = connectionID4;
const connectionID5 = _testing_db.default.id();exports.connectionID5 = connectionID5;
const connectionID6 = _testing_db.default.id();exports.connectionID6 = connectionID6;
const connectionID7 = _testing_db.default.id();exports.connectionID7 = connectionID7;
const connectionID8 = _testing_db.default.id();exports.connectionID8 = connectionID8;
const connectionID9 = _testing_db.default.id();exports.connectionID9 = connectionID9;

const entity3 = _testing_db.default.id();exports.entity3 = entity3;

const inbound = _testing_db.default.id();exports.inbound = inbound;
const template = _testing_db.default.id();exports.template = template;
const thesauri = _testing_db.default.id();
const templateWithoutProperties = _testing_db.default.id();exports.templateWithoutProperties = templateWithoutProperties;
const selectValueID = _testing_db.default.id().toString();exports.selectValueID = selectValueID;
const value1ID = _testing_db.default.id().toString();exports.value1ID = value1ID;
const value2ID = _testing_db.default.id().toString();exports.value2ID = value2ID;
const templateChangingNames = _testing_db.default.id();exports.templateChangingNames = templateChangingNames;
const relation1 = _testing_db.default.id();exports.relation1 = relation1;
const relation2 = _testing_db.default.id();exports.relation2 = relation2;
const friend = _testing_db.default.id();exports.friend = friend;
const family = _testing_db.default.id();exports.family = family;

const hub1 = _testing_db.default.id();exports.hub1 = hub1;
const hub2 = _testing_db.default.id();exports.hub2 = hub2;
const hub3 = _testing_db.default.id();exports.hub3 = hub3;
const hub4 = _testing_db.default.id();exports.hub4 = hub4;
const hub5 = _testing_db.default.id();exports.hub5 = hub5;
const hub6 = _testing_db.default.id();exports.hub6 = hub6;
const hub7 = _testing_db.default.id();exports.hub7 = hub7;
const hub8 = _testing_db.default.id();exports.hub8 = hub8;
const hub9 = _testing_db.default.id();exports.hub9 = hub9;
const hub10 = _testing_db.default.id();exports.hub10 = hub10;
const hub11 = _testing_db.default.id();exports.hub11 = hub11;
const hub12 = _testing_db.default.id();exports.hub12 = hub12;

const sharedId1 = _testing_db.default.id();
const sharedId2 = _testing_db.default.id();exports.sharedId2 = sharedId2;
const sharedId3 = _testing_db.default.id();exports.sharedId3 = sharedId3;
const sharedId4 = _testing_db.default.id();exports.sharedId4 = sharedId4;
const sharedId7 = _testing_db.default.id();exports.sharedId7 = sharedId7;var _default =

{
  connections: [
  { entity: 'entity1', hub: hub1 },
  { entity: 'entity2', hub: hub1, template: relation1 },

  { _id: connectionID5, entity: 'entity3', hub: hub2, template: relation2 },
  { _id: connectionID8, entity: 'entity2', hub: hub2, template: relation2 },
  { _id: connectionID9, entity: 'entity3', hub: hub2 },

  { entity: 'entity2', hub: hub3, template: relation2 },
  { entity: 'doc4', hub: hub3, template: relation2 },
  { entity: 'missingEntity', hub: hub3, template: relation2 },

  { entity: 'entity2', hub: hub4, template: relation1 },
  { entity: 'doc5', hub: hub4, template: relation1 },
  { entity: 'entity3', hub: hub4, template: relation1 },

  { entity: 'target', hub: hub5 },
  { entity: 'doc5', hub: hub5, range: {}, filename: 'doc5enFile' },
  { entity: 'target', hub: hub5 },

  { entity: 'target1', hub: hub6 },

  { _id: connectionID1, entity: 'entity_id', hub: hub7, template: relation1 },
  { _id: connectionID2, entity: 'another_id', hub: hub7, template: relation1 },
  { _id: connectionID3, entity: 'document_id', range: { end: 1 }, hub: hub7 },
  { entity: value2ID, hub: hub7, range: 'range1', template: relation1 },

  { _id: inbound, entity: value2ID, hub: hub8 },
  { entity: 'entity_id', hub: hub8 },
  { entity: 'entity_id', hub: hub8 },
  { hub: hub8, entity: 'doc2', range: { end: 9, text: 'another text' }, filename: 'doc2enFile' },
  { hub: hub8, entity: 'doc2', range: { end: 9, text: 'another text' }, filename: 'doc2ptFile' },

  { entity: 'bruceWayne', hub: hub9 },
  { entity: 'thomasWayne', hub: hub9, template: family },
  { entity: 'IHaveNoTemplate', hub: hub9, template: null },
  { hub: hub9, entity: 'doc2' },

  { _id: connectionID6, entity: 'entity2', hub: hub11, template: relation2 },
  { _id: connectionID7, entity: 'entity3', hub: hub11 },

  { hub: hub12, _id: connectionID4, entity: 'doc1', range: { end: 5, text: 'not empty' }, filename: 'doc1enFile' },
  { hub: hub12, entity: 'entity1' },
  { hub: hub12, entity: 'doc2', range: { end: 9, text: 'another text' }, filename: 'doc2enFile' }],

  templates: [
  { _id: templateWithoutProperties },
  { _id: template, name: 'template', properties: [
    {
      name: 'friend',
      type: 'relationship',
      label: 'friend',
      relationType: friend },

    {
      name: 'family',
      type: 'relationship',
      label: 'family',
      relationType: family },

    {
      name: 'dictionarySelect',
      type: 'select',
      content: thesauri },

    {
      name: 'dictionaryMultiSelect',
      type: 'multiselect',
      content: thesauri },

    {
      name: 'otherName',
      type: 'other' }] },


  { _id: templateChangingNames, name: 'template_changing_names', properties: [
    { id: '1', type: 'text', name: 'property1' },
    { id: '2', type: 'text', name: 'property2' },
    { id: '3', type: 'text', name: 'property3' }] }],


  entities: [
  { sharedId: 'doc1', language: 'en', title: 'doc1 en title', type: 'document', template: template, file: { filename: 'doc1enFile' }, metadata: { data: 'data3' }, creationDate: 789 },
  { sharedId: 'doc1', language: 'pt', title: 'doc1 pt title', type: 'document', template: template, file: { filename: 'doc1ptFile' }, metadata: { data: 'data3' }, creationDate: 789 },
  { sharedId: 'doc1', language: 'es', title: 'doc1 es title', type: 'document', template: template, file: { filename: 'doc1enFile' }, metadata: { data: 'data3' }, creationDate: 789 },
  { sharedId: 'doc2', language: 'en', title: 'doc2 title', type: 'document', template: template, published: true, file: { filename: 'doc2enFile' } },
  { sharedId: 'doc2', language: 'pt', title: 'doc2 title', type: 'document', template: template, published: true, file: { filename: 'doc2ptFile' } },
  { sharedId: 'doc2', language: 'es', title: 'doc2 title', type: 'document', template: template, published: true, file: { filename: 'doc2esFile' } },

  { sharedId: 'entity1', language: 'en', title: 'entity1 title', file: {}, type: 'document', template: template, icon: 'icon1', metadata: { data: 'data1' }, creationDate: 123 },
  { sharedId: 'entity1', language: 'es', title: 'entity1 title', file: {}, type: 'document', template: template, icon: 'icon1', metadata: { data: 'data1' }, creationDate: 123 },
  { sharedId: 'entity1', language: 'pt', title: 'entity1 title', file: {}, type: 'document', template: template, icon: 'icon1', metadata: { data: 'data1' }, creationDate: 123 },
  { sharedId: 'entity2', language: 'en', title: 'entity2 title', type: 'document', template: template, icon: 'icon1', metadata: { data: 'data2' }, creationDate: 123 },
  { sharedId: 'entity2', language: 'es', title: 'entity2 title', type: 'document', template: template, icon: 'icon1', metadata: { data: 'data2' }, creationDate: 123 },
  { sharedId: 'entity2', language: 'pt', title: 'entity2 title', type: 'document', template: template, icon: 'icon1', metadata: { data: 'data2' }, creationDate: 123 },
  { _id: entity3, sharedId: 'entity3', language: 'en', title: 'entity3 title', type: 'entity', template: template, published: true, icon: 'icon3', metadata: { data: 'data2' }, creationDate: 456 },
  { sharedId: 'entity3', language: 'ru', title: 'entity3 title', type: 'entity', template: template, published: true, icon: 'icon3', metadata: { data: 'data2' }, creationDate: 456 },
  { sharedId: 'entity4', language: 'en', title: 'entity4 title', type: 'entity', template: template, published: true, icon: 'icon3', metadata: { data: 'data2' }, creationDate: 456 },
  { sharedId: 'entity4', language: 'ru', title: 'entity4 title', type: 'entity', template: template, published: true, icon: 'icon3', metadata: { data: 'data2' }, creationDate: 456 },
  { sharedId: 'doc4', language: 'en', title: 'doc4 en title', type: 'document', template: template, file: { filename: 'doc4enFile' }, metadata: { data: 'data3' }, creationDate: 789 },
  { sharedId: 'doc4', language: 'pt', title: 'doc4 pt title', type: 'document', template: template, file: { filename: 'doc4ptFile' }, metadata: { data: 'data3' }, creationDate: 789 },
  { sharedId: 'doc4', language: 'es', title: 'doc4 es title', type: 'document', template: template, file: { filename: 'doc4enFile' }, metadata: { data: 'data3' }, creationDate: 789 },
  { sharedId: 'doc5', language: 'en', title: 'doc5 title', type: 'document', template: template, published: true, file: { filename: 'doc5enFile' } },
  { sharedId: 'doc5', language: 'es', title: 'doc5 title', type: 'document', template: template, published: true, file: { filename: 'doc5enFile' } },
  { sharedId: 'doc5', language: 'pt', title: 'doc5 title', type: 'document', template: template, published: true, file: { filename: 'doc5enFile' } },
  { sharedId: selectValueID, language: 'en', title: 'selectValue', type: 'entity' },
  { sharedId: value1ID, language: 'en', title: 'value1', type: 'entity' },
  { sharedId: value2ID, language: 'en', title: 'value2', type: 'entity', template },
  { sharedId: value2ID, language: 'pt', title: 'value2', type: 'entity', template },
  { sharedId: 'bruceWayne', language: 'en', title: 'bruceWayne', type: 'entity', template },
  { sharedId: 'bruceWayne', language: 'pt', title: 'bruceWayne', type: 'entity', template },
  { sharedId: 'thomasWayne', language: 'en', title: 'thomasWayne', type: 'entity', template },
  { sharedId: 'thomasWayne', language: 'pt', title: 'thomasWayne', type: 'entity', template },
  { sharedId: 'alfred', language: 'en', title: 'alfred', type: 'entity', template },
  { sharedId: 'robin', language: 'en', title: 'robin', type: 'entity', template },
  { sharedId: 'IHaveNoTemplate', language: 'en', title: 'no template', type: 'entity', template },
  { sharedId: 'IHaveNoTemplate', language: 'pt', title: 'no template', type: 'entity', template },
  { sharedId: 'entity_id', language: 'en', title: 'en entity', type: 'entity', template },
  { sharedId: 'entity_id', language: 'pt', title: 'en entity', type: 'entity', template }],

  dictionaries: [
  { _id: thesauri }],

  relationtypes: [
  { _id: relation1, name: 'relation 1', properties: [
    { type: 'text', name: 'title' },
    { type: 'multiselect', name: 'options' },
    { type: 'date', name: 'date' }] },

  { _id: relation2, name: 'relation 2' },
  { _id: friend, name: 'friend' },
  { _id: family, name: 'family' }],


  settings: [
  { languages: [{ key: 'en' }, { key: 'es' }] }] };exports.default = _default;