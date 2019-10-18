"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.swapTemplate = exports.templateWithContents = exports.templateToBeDeleted = exports.templateToBeEditedId = exports.default = void 0;
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _templateTypes = require("../../../shared/templateTypes");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable */

const templateToBeEditedId = _testing_db.default.id();exports.templateToBeEditedId = templateToBeEditedId;
const templateToBeDeleted = '589af97080fc0b23471d67f1';exports.templateToBeDeleted = templateToBeDeleted;
const templateWithContents = _testing_db.default.id();exports.templateWithContents = templateWithContents;
const swapTemplate = _testing_db.default.id();exports.swapTemplate = swapTemplate;var _default =
{
  templates: [
  {
    _id: templateToBeEditedId,
    name: 'template to be edited',
    commonProperties: [{ name: 'title', label: 'Title' }],
    default: true },

  {
    _id: _testing_db.default.id(templateToBeDeleted),
    name: 'to be deleted',
    commonProperties: [{ name: 'title', label: 'Title' }] },

  {
    _id: _testing_db.default.id(),
    name: 'duplicated name',
    commonProperties: [{ name: 'title', label: 'Title' }] },

  {
    _id: _testing_db.default.id(),
    name: 'thesauri template',
    properties: [
    { type: _templateTypes.templateTypes.select, content: 'thesauri1', label: 'select' },
    { type: _templateTypes.templateTypes.relationship, content: templateToBeDeleted, label: 'select2' }],

    commonProperties: [{ name: 'title', label: 'Title' }] },

  {
    _id: _testing_db.default.id(),
    name: 'thesauri template 2',
    properties: [
    { type: _templateTypes.templateTypes.select, content: 'thesauri1', label: 'select2' },
    { type: _templateTypes.templateTypes.select, content: templateToBeDeleted, label: 'selectToBeDeleted' }],

    commonProperties: [{ name: 'title', label: 'Title' }] },

  {
    _id: _testing_db.default.id(),
    name: 'thesauri template 3',
    properties: [
    { type: _templateTypes.templateTypes.text, label: 'text' },
    { type: _templateTypes.templateTypes.text, label: 'text2' },
    { type: _templateTypes.templateTypes.select, content: templateToBeDeleted, label: 'selectToBeDeleted' }],

    commonProperties: [{ name: 'title', label: 'Title' }] },

  {
    _id: templateWithContents,
    name: 'content template',
    commonProperties: [{ name: 'title', label: 'Title' }],
    properties: [
    { id: '1', type: _templateTypes.templateTypes.select, content: 'thesauri1', label: 'select3' },
    { id: '2', type: _templateTypes.templateTypes.multiselect, content: 'thesauri2', label: 'select4' }] },


  {
    _id: swapTemplate,
    name: 'swap names template',
    commonProperties: [{ name: 'title', label: 'Title' }],
    properties: [
    { id: '1', type: _templateTypes.templateTypes.text, name: 'text', label: 'Text' },
    { id: '2', type: _templateTypes.templateTypes.select, name: 'select', label: 'Select' }] }],



  settings: [
  {
    _id: _testing_db.default.id(),
    site_name: 'Uwazi',
    languages: [
    { key: 'en', label: 'English', default: true }] }] };exports.default = _default;