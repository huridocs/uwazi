"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.translation1 = exports.relationtype7 = exports.relationtype6 = exports.relationtype5 = exports.relationtype4 = exports.relationtype3 = exports.relationtype2 = exports.relationtype1 = exports.relationship11 = exports.relationship10 = exports.relationship9 = exports.relationship8 = exports.relationship7 = exports.relationship6 = exports.relationship5 = exports.relationship4 = exports.relationship3 = exports.relationship2 = exports.relationship1 = exports.thesauri5 = exports.thesauri4 = exports.thesauri3Value2 = exports.thesauri3Value1 = exports.thesauri3 = exports.thesauri2 = exports.thesauri1Value2 = exports.thesauri1Value1 = exports.thesauri1 = exports.template3PropertyRelationship1 = exports.template3 = exports.template2PropertyRelationship2 = exports.template2PropertyRelationship1 = exports.template2PropertyThesauri5Select = exports.template2 = exports.template1PropertyRelationship2 = exports.template1PropertyRelationship1 = exports.template1PropertyThesauri3MultiSelect = exports.template1PropertyThesauri2Select = exports.template1PropertyThesauri1Select = exports.template1Property3 = exports.template1Property2 = exports.template1Property1 = exports.template1 = exports.newDoc10 = exports.newDoc4 = exports.newDoc2 = exports.newDoc1 = exports.settingsId = exports.default = void 0;
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable max-len */

const oldDoc1 = _testing_db.default.id();
const oldDoc2 = _testing_db.default.id();

const newDoc1 = _testing_db.default.id();exports.newDoc1 = newDoc1;
const newDoc2 = _testing_db.default.id();exports.newDoc2 = newDoc2;
const newDoc3 = _testing_db.default.id();
const newDoc4 = _testing_db.default.id();exports.newDoc4 = newDoc4;
const newDoc5 = _testing_db.default.id();
const newDoc6 = _testing_db.default.id();
const newDoc7 = _testing_db.default.id();
const newDoc8 = _testing_db.default.id();
const newDoc9 = _testing_db.default.id();
const newDoc10 = _testing_db.default.id();exports.newDoc10 = newDoc10;

const template1 = _testing_db.default.id();exports.template1 = template1;

const template1Property1 = _testing_db.default.id();exports.template1Property1 = template1Property1;
const template1Property2 = _testing_db.default.id();exports.template1Property2 = template1Property2;
const template1Property3 = _testing_db.default.id();exports.template1Property3 = template1Property3;
const template1PropertyThesauri1Select = _testing_db.default.id();exports.template1PropertyThesauri1Select = template1PropertyThesauri1Select;
const template1PropertyThesauri2Select = _testing_db.default.id();exports.template1PropertyThesauri2Select = template1PropertyThesauri2Select;
const template1PropertyThesauri3MultiSelect = _testing_db.default.id();exports.template1PropertyThesauri3MultiSelect = template1PropertyThesauri3MultiSelect;
const template1PropertyRelationship1 = _testing_db.default.id();exports.template1PropertyRelationship1 = template1PropertyRelationship1;
const template1PropertyRelationship2 = _testing_db.default.id();exports.template1PropertyRelationship2 = template1PropertyRelationship2;

const template2 = _testing_db.default.id();exports.template2 = template2;
const template2PropertyThesauri5Select = _testing_db.default.id();exports.template2PropertyThesauri5Select = template2PropertyThesauri5Select;
const template2PropertyRelationship1 = _testing_db.default.id();exports.template2PropertyRelationship1 = template2PropertyRelationship1;
const template2PropertyRelationship2 = _testing_db.default.id();exports.template2PropertyRelationship2 = template2PropertyRelationship2;

const template3 = _testing_db.default.id();exports.template3 = template3;
const template3PropertyRelationship1 = _testing_db.default.id();exports.template3PropertyRelationship1 = template3PropertyRelationship1;

const thesauri1 = _testing_db.default.id();exports.thesauri1 = thesauri1;
const thesauri1Value1 = _testing_db.default.id();exports.thesauri1Value1 = thesauri1Value1;
const thesauri1Value2 = _testing_db.default.id();exports.thesauri1Value2 = thesauri1Value2;

const thesauri2 = _testing_db.default.id();exports.thesauri2 = thesauri2;

const thesauri3 = _testing_db.default.id();exports.thesauri3 = thesauri3;
const thesauri3Value1 = _testing_db.default.id();exports.thesauri3Value1 = thesauri3Value1;
const thesauri3Value2 = _testing_db.default.id();exports.thesauri3Value2 = thesauri3Value2;

const thesauri4 = _testing_db.default.id();exports.thesauri4 = thesauri4;
const thesauri5 = _testing_db.default.id();exports.thesauri5 = thesauri5;

const relationship1 = _testing_db.default.id();exports.relationship1 = relationship1;
const relationship2 = _testing_db.default.id();exports.relationship2 = relationship2;
const relationship3 = _testing_db.default.id();exports.relationship3 = relationship3;
const relationship4 = _testing_db.default.id();exports.relationship4 = relationship4;
const relationship5 = _testing_db.default.id();exports.relationship5 = relationship5;
const relationship6 = _testing_db.default.id();exports.relationship6 = relationship6;
const relationship7 = _testing_db.default.id();exports.relationship7 = relationship7;
const relationship8 = _testing_db.default.id();exports.relationship8 = relationship8;
const relationship9 = _testing_db.default.id();exports.relationship9 = relationship9;
const relationship10 = _testing_db.default.id();exports.relationship10 = relationship10;
const relationship11 = _testing_db.default.id();exports.relationship11 = relationship11;

const relationtype1 = _testing_db.default.id();exports.relationtype1 = relationtype1;
const relationtype2 = _testing_db.default.id();exports.relationtype2 = relationtype2;
const relationtype3 = _testing_db.default.id();exports.relationtype3 = relationtype3;
const relationtype4 = _testing_db.default.id();exports.relationtype4 = relationtype4;
const relationtype5 = _testing_db.default.id();exports.relationtype5 = relationtype5;
const relationtype6 = _testing_db.default.id();exports.relationtype6 = relationtype6;
const relationtype7 = _testing_db.default.id();exports.relationtype7 = relationtype7;

const hub1 = _testing_db.default.id();
const hub2 = _testing_db.default.id();
const hub3 = _testing_db.default.id();

const translation1 = _testing_db.default.id();exports.translation1 = translation1;

const settingsId = _testing_db.default.id();exports.settingsId = settingsId;
const sessionsId = _testing_db.default.id();var _default =

{
  syncs: [
  {
    lastSync: 10000 }],



  updatelogs: [
  {
    timestamp: 20000,
    namespace: 'entities',
    mongoId: newDoc4,
    deleted: true },

  {
    timestamp: 22000,
    namespace: 'connections',
    mongoId: relationship2,
    deleted: false },

  {
    timestamp: 20000,
    namespace: 'connections',
    mongoId: relationship1,
    deleted: false },

  {
    timestamp: 11000,
    namespace: 'connections',
    mongoId: relationship3,
    deleted: false },

  {
    timestamp: 11001,
    namespace: 'connections',
    mongoId: relationship4,
    deleted: false },

  {
    timestamp: 11002,
    namespace: 'connections',
    mongoId: relationship5,
    deleted: false },

  {
    timestamp: 11001,
    namespace: 'connections',
    mongoId: relationship6,
    deleted: false },

  {
    timestamp: 11010,
    namespace: 'connections',
    mongoId: relationship7,
    deleted: false },

  {
    timestamp: 11011,
    namespace: 'connections',
    mongoId: relationship8,
    deleted: false },

  {
    timestamp: 11012,
    namespace: 'connections',
    mongoId: relationship9,
    deleted: false },

  {
    timestamp: 11012,
    namespace: 'connections',
    mongoId: relationship10,
    deleted: false },

  {
    timestamp: 11013,
    namespace: 'connections',
    mongoId: relationship11,
    deleted: false },

  {
    timestamp: 6000,
    namespace: 'entities',
    mongoId: oldDoc1,
    deleted: false },

  {
    timestamp: 7000,
    namespace: 'entities',
    mongoId: oldDoc2,
    deleted: false },

  {
    timestamp: 12000,
    namespace: 'entities',
    mongoId: newDoc2,
    deleted: false },

  {
    timestamp: 9000,
    namespace: 'entities',
    mongoId: newDoc1,
    deleted: false },

  {
    timestamp: 9000,
    namespace: 'entities',
    mongoId: newDoc6,
    deleted: false },

  {
    timestamp: 9003,
    namespace: 'entities',
    mongoId: newDoc10,
    deleted: false },

  {
    timestamp: 9000,
    namespace: 'templates',
    mongoId: template1,
    deleted: false },

  {
    timestamp: 9000,
    namespace: 'templates',
    mongoId: template2,
    deleted: false },

  {
    timestamp: 9000,
    namespace: 'templates',
    mongoId: template3,
    deleted: false },

  {
    timestamp: 9006,
    namespace: 'dictionaries',
    mongoId: thesauri1,
    deleted: false },

  {
    timestamp: 9009,
    namespace: 'dictionaries',
    mongoId: thesauri2,
    deleted: false },

  {
    timestamp: 9007,
    namespace: 'dictionaries',
    mongoId: thesauri3,
    deleted: false },

  {
    timestamp: 9008,
    namespace: 'dictionaries',
    mongoId: thesauri4,
    deleted: true },

  {
    timestamp: 9001,
    namespace: 'dictionaries',
    mongoId: thesauri5,
    deleted: false },

  {
    timestamp: 9100,
    namespace: 'relationtypes',
    mongoId: relationtype1,
    deleted: false },

  {
    timestamp: 9103,
    namespace: 'relationtypes',
    mongoId: relationtype2,
    deleted: false },

  {
    timestamp: 9102,
    namespace: 'relationtypes',
    mongoId: relationtype3,
    deleted: false },

  {
    timestamp: 9101,
    namespace: 'relationtypes',
    mongoId: relationtype4,
    deleted: false },

  {
    timestamp: 9107,
    namespace: 'relationtypes',
    mongoId: relationtype5,
    deleted: false },

  {
    timestamp: 9106,
    namespace: 'relationtypes',
    mongoId: relationtype6,
    deleted: false },

  {
    timestamp: 9105,
    namespace: 'relationtypes',
    mongoId: relationtype7,
    deleted: false },

  {
    timestamp: 9000,
    namespace: 'migrations',
    mongoId: newDoc1,
    deleted: false },

  {
    timestamp: 9001,
    namespace: 'settings',
    mongoId: settingsId,
    deleted: false },

  {
    timestamp: 9002,
    namespace: 'sessions',
    mongoId: sessionsId,
    deleted: false },

  {
    timestamp: 11500,
    namespace: 'translations',
    mongoId: translation1,
    deleted: false }],



  entities: [
  {
    _id: newDoc1,
    sharedId: 'newDoc1SharedId',
    title: 'a new entity',
    template: template1,
    file: {
      filename: 'test.txt',
      timestamp: 9500 },

    attachments: [
    {
      filename: 'test_attachment.txt',
      timestamp: 10000 },

    {
      filename: 'test_attachment2.txt',
      timestamp: 9500 },

    {
      filename: 'test_attachment3.txt',
      timestamp: 7000 }],


    metadata: {
      t1Property1: 'sync property 1',
      t1Property2: 'sync property 2',
      t1Property3: 'sync property 3',
      t1Thesauri1Select: thesauri1Value2,
      t1Thesauri2Select: _testing_db.default.id(),
      t1Thesauri3MultiSelect: [thesauri3Value2, thesauri3Value1] } },


  {
    _id: newDoc2,
    title: 'another new entity',
    template: template1,
    file: {
      filename: 'test.txt',
      timestamp: 7000 },

    metadata: {
      t1Property1: 'another doc property 1',
      t1Property2: 'another doc property 2',
      t1Thesauri3MultiSelect: [thesauri3Value2] } },


  {
    _id: newDoc3,
    sharedId: 'newDoc3SharedId',
    title: 'New Doc 3',
    template: template2 },

  {
    _id: newDoc5,
    sharedId: 'newDoc5SharedId',
    title: 'New Doc 5',
    template: template1 },

  {
    _id: newDoc6,
    sharedId: 'newDoc6SharedId',
    title: 'new doc 6',
    template: template3,
    file: {
      filename: 'test.txt' } },


  {
    _id: newDoc7,
    sharedId: 'newDoc7SharedId',
    title: 'New Doc 7',
    template: template2 },

  {
    _id: newDoc8,
    sharedId: 'newDoc8SharedId',
    title: 'New Doc 8',
    template: template2 },

  {
    _id: newDoc9,
    sharedId: 'newDoc9SharedId',
    title: 'New Doc 9',
    template: template2 },

  {
    _id: newDoc10,
    sharedId: 'newDoc10SharedId',
    title: 'New Doc 10',
    template: null }],



  connections: [
  {
    _id: relationship1,
    entity: 'newDoc1SharedId',
    template: relationtype1,
    hub: hub1 },

  {
    _id: relationship2,
    entity: 'newDoc1SharedId',
    template: relationtype3,
    hub: hub1 },

  {
    _id: relationship3,
    entity: 'newDoc6SharedId',
    template: relationtype1,
    hub: hub1 },

  {
    _id: relationship4,
    entity: 'newDoc1SharedId',
    template: relationtype2,
    hub: hub2 },

  {
    _id: relationship5,
    entity: 'newDoc5SharedId',
    template: relationtype7,
    hub: hub2 },

  {
    _id: relationship8,
    entity: 'newDoc7SharedId',
    template: relationtype7,
    hub: hub2 },

  {
    _id: relationship6,
    entity: 'newDoc5SharedId',
    template: relationtype6,
    hub: hub2 },

  {
    _id: relationship7,
    entity: 'newDoc3SharedId',
    template: null,
    hub: hub2 },

  {
    _id: relationship9,
    entity: 'newDoc1SharedId',
    template: null,
    hub: hub3 },

  {
    _id: relationship10,
    entity: 'newDoc8SharedId',
    template: relationtype4,
    hub: hub3 },

  {
    _id: relationship11,
    entity: 'newDoc9SharedId',
    template: relationtype4,
    hub: hub3 }],



  relationtypes: [
  { _id: relationtype1 },
  { _id: relationtype2 },
  { _id: relationtype3 },
  { _id: relationtype4 },
  { _id: relationtype5 },
  { _id: relationtype6 },
  { _id: relationtype7 }],


  templates: [
  {
    _id: template1,
    name: 'template1',
    properties: [
    {
      _id: template1Property1,
      name: 't1Property1',
      label: 't1Property1L' },

    {
      _id: template1Property2,
      name: 't1Property2',
      label: 't1Property2L' },

    {
      _id: template1Property3,
      name: 't1Property3',
      label: 't1Property3L' },

    {
      _id: template1PropertyThesauri1Select,
      name: 't1Thesauri1Select',
      label: 't1Thesauri1SelectL',
      type: 'select',
      content: thesauri1 },

    {
      _id: template1PropertyThesauri2Select,
      name: 't1Thesauri2Select',
      label: 't1Thesauri2SelectL',
      type: 'select',
      content: thesauri2 },

    {
      _id: template1PropertyThesauri3MultiSelect,
      name: 't1Thesauri3MultiSelect',
      label: 't1Thesauri3MultiSelectL',
      type: 'multiselect',
      content: thesauri3 },

    {
      _id: template1PropertyRelationship1,
      name: 't1Relationship1',
      label: 't1Relationship1L',
      type: 'relationship',
      content: '',
      relationType: relationtype4 },

    {
      _id: template1PropertyRelationship2,
      name: 't1Relationship2',
      label: 't1Relationship2L',
      type: 'relationship',
      content: '',
      relationType: relationtype5 }] },



  {
    _id: template2,
    name: 'template2',
    properties: [
    {
      _id: template2PropertyThesauri5Select,
      name: 't2Thesauri3MultiSelect',
      label: 't2Thesauri3MultiSelectL',
      type: 'select',
      content: thesauri5 },

    {
      _id: template2PropertyRelationship1,
      name: 't2Relationship1',
      label: 't2Relationship1L',
      type: 'relationship',
      content: '',
      relationType: relationtype6 },

    {
      _id: template2PropertyRelationship2,
      name: 't2Relationship2',
      label: 't2Relationship2L',
      type: 'relationship',
      content: template1,
      relationType: relationtype7 }] },



  {
    _id: template3,
    properties: [
    {
      _id: template3PropertyRelationship1,
      name: 't3Relationship2',
      type: 'relationship',
      content: '',
      relationType: relationtype1 }] }],





  dictionaries: [
  {
    _id: thesauri1,
    values: [
    {
      _id: thesauri1Value1,
      label: 'th1value1' },

    {
      _id: thesauri1Value2,
      label: 'th1value2' }] },



  {
    _id: thesauri2 },

  {
    _id: thesauri3,
    values: [
    {
      _id: thesauri3Value1,
      label: 'th3value1' },

    {
      _id: thesauri3Value2,
      label: 'th3value2' }] },



  {
    _id: thesauri4 },

  {
    _id: thesauri5 }],



  translations: [
  {
    _id: translation1,
    locale: 'en',
    contexts: [
    {
      id: 'System',
      values: [{ key: 'Sytem Key', value: 'System Value' }] },

    {
      type: 'Entity',
      id: template1,
      values: [
      { key: 'template1', value: 'template1T' },
      { key: 't1Property1L', value: 't1Property1T' },
      { key: 't1Relationship1L', value: 't1Relationship1T' },
      { key: 't1Relationship2L', value: 't1Relationship2T' },
      { key: 't1Thesauri2SelectL', value: 't1Thesauri2SelectT' },
      { key: 't1Thesauri3MultiSelectL', value: 't1Thesauri3MultiSelectT' }] },


    {
      type: 'Entity',
      id: template2,
      values: [
      { key: 'template2', value: 'template2T' },
      { key: 't2Relationship2L', value: 't2Relationship2T' },
      { key: 'anotherL', value: 'anotherT' }] },


    {
      type: 'Entity',
      id: template3 },

    {
      type: 'Dictionary',
      id: thesauri1 },

    {
      type: 'Dictionary',
      id: thesauri2 },

    {
      type: 'Dictionary',
      id: thesauri3,
      values: 'All values from t3' },

    {
      type: 'Connection',
      id: relationtype1,
      values: 'All values from r1' },

    {
      type: 'Connection',
      id: relationtype2 },

    {
      type: 'Connection',
      id: relationtype4,
      values: 'All values from r4' },

    {
      type: 'Connection',
      id: relationtype7,
      values: 'All values from r7' }] }],





  settings: [
  {
    _id: settingsId,
    languages: [{ key: 'es', default: true }],
    sync: {
      url: 'url',
      active: true,
      config: {} } }],




  sessions: [
  { _id: sessionsId }] };exports.default = _default;