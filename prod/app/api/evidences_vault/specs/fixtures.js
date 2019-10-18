"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.templateId = exports.default = void 0;
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _templateTypes = require("../../../shared/templateTypes");
var _templates = require("../../templates");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable max-len */

const templateId = _testing_db.default.id();exports.templateId = templateId;var _default =

{
  templates: [
  {
    _id: templateId,
    name: 'template',
    properties: [
    {
      type: _templateTypes.templateTypes.media,
      label: 'video',
      name: _templates.templateUtils.safeName('video') },

    {
      type: _templateTypes.templateTypes.link,
      label: 'original url',
      name: _templates.templateUtils.safeName('original url') },

    {
      type: _templateTypes.templateTypes.image,
      label: 'screenshot',
      name: _templates.templateUtils.safeName('screenshot') },

    {
      type: _templateTypes.templateTypes.date,
      label: 'time of request',
      name: _templates.templateUtils.safeName('time of request') },

    {
      type: _templateTypes.templateTypes.markdown,
      label: 'data',
      name: _templates.templateUtils.safeName('data') }] }],




  settings: [
  {
    _id: _testing_db.default.id(),
    site_name: 'Uwazi',
    languages: [
    { key: 'en', label: 'English', default: true }] }] };exports.default = _default;