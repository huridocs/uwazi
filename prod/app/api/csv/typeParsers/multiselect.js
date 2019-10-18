"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _thesauris = _interopRequireDefault(require("../../thesauris"));
var _filters = require("../../utils/filters");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const multiselect = async (entityToImport, templateProperty) => {
  const currentThesauri = await _thesauris.default.getById(templateProperty.content);

  const values = entityToImport[templateProperty.name].split('|').
  map(v => v.trim()).
  filter(_filters.emptyString).
  filter(_filters.unique);

  const newValues = values.filter((v) =>
  !currentThesauri.values.find(cv => cv.label.trim().toLowerCase() === v.toLowerCase()));

  const lowerCaseValues = values.map(v => v.toLowerCase());
  if (!newValues.length) {
    return currentThesauri.values.
    filter(value => lowerCaseValues.includes(value.label.trim().toLowerCase())).
    map(value => value.id);
  }

  const updated = await _thesauris.default.save(_objectSpread({},
  currentThesauri, {
    values: currentThesauri.values.concat(
    newValues.map(label => ({ label }))) }));



  return updated.values.
  filter(value => lowerCaseValues.includes(value.label.toLowerCase())).
  map(value => value.id);
};var _default =

multiselect;exports.default = _default;