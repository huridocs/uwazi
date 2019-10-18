"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _url = _interopRequireDefault(require("url"));

var _geolocation = _interopRequireDefault(require("./typeParsers/geolocation.js"));
var _multiselect = _interopRequireDefault(require("./typeParsers/multiselect.js"));
var _select = _interopRequireDefault(require("./typeParsers/select.js"));
var _relationship = _interopRequireDefault(require("./typeParsers/relationship.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  geolocation: _geolocation.default,
  select: _select.default,
  multiselect: _multiselect.default,
  relationship: _relationship.default,

  async default(entityToImport, templateProperty) {
    return this.text(entityToImport, templateProperty);
  },

  async text(entityToImport, templateProperty) {
    return entityToImport[templateProperty.name];
  },

  async date(entityToImport, templateProperty) {
    return new Date(`${entityToImport[templateProperty.name]} UTC`).getTime() / 1000;
  },

  async link(entityToImport, templateProperty) {
    let [label, linkUrl] = entityToImport[templateProperty.name].split('|');

    if (!linkUrl) {
      linkUrl = entityToImport[templateProperty.name];
      label = linkUrl;
    }

    if (!_url.default.parse(linkUrl).host) {
      return null;
    }

    return {
      label,
      url: linkUrl };

  } };exports.default = _default;