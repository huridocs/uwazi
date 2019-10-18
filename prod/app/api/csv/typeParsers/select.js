"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _thesauris = _interopRequireDefault(require("../../thesauris"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const select = async (entityToImport, templateProperty) => {
  const currentThesauri = await _thesauris.default.getById(templateProperty.content);
  if (entityToImport[templateProperty.name].trim() === '') {
    return null;
  }

  const thesauriMatching =
  v => v.label.trim().toLowerCase() === entityToImport[templateProperty.name].trim().toLowerCase();

  const value = currentThesauri.values.find(thesauriMatching);

  if (value) {
    return value.id;
  }

  const updated = await _thesauris.default.save(_objectSpread({},
  currentThesauri, {
    values: currentThesauri.values.concat([{
      label: entityToImport[templateProperty.name] }]) }));



  return updated.values.find(thesauriMatching).id;
};var _default =

select;exports.default = _default;