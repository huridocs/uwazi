"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.dictionaryWithValueGroups = exports.dictionaryValueId = exports.dictionaryIdToTranslate = exports.dictionaryId = exports.default = void 0;
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable max-len */

const entityTemplateId = '589af97080fc0b23471d67f3';
const dictionaryId = '589af97080fc0b23471d67f4';exports.dictionaryId = dictionaryId;
const dictionaryIdToTranslate = '589af97080fc0b23471d67f5';exports.dictionaryIdToTranslate = dictionaryIdToTranslate;
const dictionaryWithValueGroups = _testing_db.default.id();exports.dictionaryWithValueGroups = dictionaryWithValueGroups;
const dictionaryValueId = '1';exports.dictionaryValueId = dictionaryValueId;var _default =

{
  dictionaries: [
  { _id: _testing_db.default.id(), name: 'dictionary' },
  { _id: _testing_db.default.id(dictionaryId), name: 'dictionary 2', values: [{ label: 'value 1' }, { label: 'value 2' }] },
  {
    _id: _testing_db.default.id(dictionaryIdToTranslate),
    name: 'Top 2 scify books',
    values: [
    { id: dictionaryValueId, label: 'Enders game' },
    { id: '2', label: 'Fundation' }] },


  {
    _id: dictionaryWithValueGroups,
    name: 'Top movies',
    values: [
    {
      id: '1',
      label: 'scy fi',
      values: [
      { id: '1.1', label: 'groundhog day' },
      { id: '1.2', label: 'terminator 2' }] },


    {
      id: '2',
      label: 'superheros',
      values: [
      { id: '2.1', label: 'batman' },
      { id: '2.2', label: 'spiderman' }] },


    { id: '3', label: 'single value' }] }],



  templates: [
  { _id: _testing_db.default.id(entityTemplateId), name: 'entityTemplate', properties: [{}] },
  { _id: _testing_db.default.id(), name: 'documentTemplate', properties: [{}] }],

  entities: [
  { _id: _testing_db.default.id(), sharedId: 'sharedId', type: 'entity', title: 'english entity', language: 'en', template: _testing_db.default.id(entityTemplateId), icon: 'Icon' },
  { _id: _testing_db.default.id(), sharedId: 'sharedId', type: 'entity', title: 'spanish entity', language: 'es', template: _testing_db.default.id(entityTemplateId), icon: 'Icon', published: true },
  { _id: _testing_db.default.id(), sharedId: 'other', type: 'entity', title: 'unpublished entity', language: 'es', template: _testing_db.default.id(entityTemplateId), published: false }],

  settings: [
  { _id: _testing_db.default.id(), languages: [{ key: 'es', default: true }] }] };exports.default = _default;