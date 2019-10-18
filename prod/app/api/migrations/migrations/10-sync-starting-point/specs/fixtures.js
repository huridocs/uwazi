"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.migration1 = exports.connection1 = exports.translation1 = exports.entity3 = exports.entity1 = exports.template2 = exports.template1 = exports.default = void 0;var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const settings = _testing_db.default.id();
const [template1, template2, entity1, entity2, entity3] = [_testing_db.default.id(), _testing_db.default.id(), _testing_db.default.id(), _testing_db.default.id(), _testing_db.default.id()];exports.entity3 = entity3;exports.entity1 = entity1;exports.template2 = template2;exports.template1 = template1;
const [connection1, thesauri1, translation1, relationtype1, migration1] = [_testing_db.default.id(), _testing_db.default.id(), _testing_db.default.id(), _testing_db.default.id(), _testing_db.default.id()];exports.migration1 = migration1;exports.translation1 = translation1;exports.connection1 = connection1;var _default =

{
  settings: [{ _id: settings, prop: 'prop' }],

  templates: [
  { _id: template1 },
  { _id: template2 }],


  entities: [
  { _id: entity1 },
  { _id: entity2 },
  { _id: entity3 }],


  connections: [
  { _id: connection1 }],


  dictionaries: [
  { _id: thesauri1 }],


  translations: [
  { _id: translation1 }],


  relationtypes: [
  { _id: relationtype1 }],


  migrations: [
  { _id: migration1 }],


  updatelogs: [
  { mongoId: template1, previous: 'previous log 1' },
  { mongoId: connection1, previous: 'previous log 2' }] };exports.default = _default;