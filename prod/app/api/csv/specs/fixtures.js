"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.templateToRelateId = exports.thesauri2Id = exports.thesauri1Id = exports.template1Id = exports.default = void 0;var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _templateTypes = require("../../../shared/templateTypes");
var _templates = require("../../templates");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const template1Id = _testing_db.default.id();exports.template1Id = template1Id;
const thesauri1Id = _testing_db.default.id();exports.thesauri1Id = thesauri1Id;
const thesauri2Id = _testing_db.default.id();exports.thesauri2Id = thesauri2Id;
const templateToRelateId = _testing_db.default.id();exports.templateToRelateId = templateToRelateId;var _default =

{
  templates: [
  {
    _id: templateToRelateId,
    name: 'template to relate',
    properties: [] },

  {
    _id: template1Id,
    name: 'base template',
    properties: [
    {
      type: _templateTypes.templateTypes.text,
      label: 'text label',
      name: _templates.templateUtils.safeName('text label') },

    {
      type: _templateTypes.templateTypes.select,
      label: 'select label',
      name: _templates.templateUtils.safeName('select label'),
      content: thesauri1Id },

    {
      type: 'non_defined_type',
      label: 'not defined type',
      name: _templates.templateUtils.safeName('not defined type') },

    {
      type: _templateTypes.templateTypes.text,
      label: 'not configured on csv',
      name: _templates.templateUtils.safeName('not configured on csv') }] }],





  dictionaries: [
  {
    _id: thesauri1Id,
    name: 'thesauri1',
    values: [{
      label: ' value4 ',
      id: _testing_db.default.id().toString() }] }],




  settings: [
  {
    _id: _testing_db.default.id(),
    site_name: 'Uwazi',
    languages: [
    { key: 'en', label: 'English', default: true }] }],




  translations: [
  {
    _id: _testing_db.default.id(),
    locale: 'en',
    contexts: [] }] };exports.default = _default;