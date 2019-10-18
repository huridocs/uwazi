"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.documentTemplateId = exports.englishTranslation = exports.entityTemplateId = exports.default = void 0;var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const entityTemplateId = _testing_db.default.id();exports.entityTemplateId = entityTemplateId;
const documentTemplateId = _testing_db.default.id();exports.documentTemplateId = documentTemplateId;
const englishTranslation = _testing_db.default.id();exports.englishTranslation = englishTranslation;var _default =
{
  translations: [
  {
    _id: englishTranslation,
    locale: 'en',
    contexts: [
    {
      _id: _testing_db.default.id(),
      id: 'System',
      label: 'System',
      values: [
      { key: 'Password', value: 'Password' },
      { key: 'Account', value: 'Account' },
      { key: 'Email', value: 'E-Mail' },
      { key: 'Age', value: 'Age' }] },


    {
      _id: _testing_db.default.id(),
      id: 'Filters',
      label: 'Filters' },

    {
      _id: _testing_db.default.id(),
      id: 'Menu',
      label: 'Menu' },

    {
      _id: _testing_db.default.id(),
      id: entityTemplateId.toString(),
      label: 'Judge',
      values: [],
      type: 'Entity' },

    {
      _id: _testing_db.default.id(),
      id: documentTemplateId.toString(),
      label: 'Court order',
      values: [],
      type: 'Document' }] },



  {
    _id: _testing_db.default.id(),
    type: 'translation',
    locale: 'es',
    contexts: [
    {
      id: 'System',
      label: 'System',
      values: [
      { key: 'Password', value: 'Contraseña' },
      { key: 'Account', value: 'Cuenta' },
      { key: 'Email', value: 'Correo electronico' },
      { key: 'Age', value: 'Edad' }] }] },




  {
    _id: _testing_db.default.id(),
    type: 'translation',
    locale: 'other',
    contexts: [] }],


  settings: [
  {
    _id: _testing_db.default.id(),
    languages: [
    {
      key: 'es',
      label: 'Español' },

    {
      key: 'en',
      label: 'English',
      default: true }] }],




  templates: [
  {
    _id: entityTemplateId,
    type: 'template' },

  {
    _id: documentTemplateId,
    type: 'template' }] };exports.default = _default;