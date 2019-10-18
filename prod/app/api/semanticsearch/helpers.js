"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.extractDocumentContent = exports.setSearchDocumentResults = exports.updateSearchDocumentStatus = exports.removePageAnnotations = exports.getSearchDocuments = void 0;var _search = require("../search");
var _model = _interopRequireDefault(require("./model"));
var _resultsModel = _interopRequireDefault(require("./resultsModel"));
var _statuses = require("./statuses");
var _templates = _interopRequireDefault(require("../templates"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const getSearchDocuments = async ({ documents, query }, language, user) => {
  if (documents && documents.length) {
    return documents;
  }
  const _query = _objectSpread({}, query, { limit: 9999, searchTerm: '' });
  const res = await _search.search.search(_query, language, user);
  return res.rows.map(doc => doc.sharedId);
};exports.getSearchDocuments = getSearchDocuments;

const removePageAnnotations = text => text.replace(/\[\[\d+\]\]/g, '');exports.removePageAnnotations = removePageAnnotations;

const updateSearchDocumentStatus = async (searchId, sharedId, status) => _model.default.db.findOneAndUpdate({
  _id: searchId,
  'documents.sharedId': sharedId },
{
  $set: { 'documents.$.status': status } },
{ new: true, lean: true });exports.updateSearchDocumentStatus = updateSearchDocumentStatus;

const setSearchDocumentResults = async (searchId, sharedId, results) => {
  const averageScore = results.length ?
  results.reduce((total, curr) => total + curr.score, 0) / results.length :
  0;
  const _results = [...results];
  const docResults = await _resultsModel.default.db.findOneAndUpdate({
    sharedId,
    searchId },
  {
    sharedId,
    searchId,
    averageScore,
    results: _results.sort((r1, r2) => r2.score - r1.score),
    status: _statuses.COMPLETED },
  { upsert: true, new: true });
  return docResults;
};exports.setSearchDocumentResults = setSearchDocumentResults;

const extractDocumentContent = async doc => {
  const { fullText, metadata } = doc;
  const contents = {};

  if (metadata) {
    const template = await _templates.default.getById(doc.template);
    const metadataFields = template.properties.filter(prop => prop.type === 'markdown');

    metadataFields.forEach(field => {
      if (metadata[field.name]) {
        contents[field.name] = metadata[field.name];
      }
    });
  }

  if (fullText) {
    Object.keys(fullText).forEach(page => {
      contents[page] = removePageAnnotations(fullText[page]);
    });
  }

  return contents;
};exports.extractDocumentContent = extractDocumentContent;