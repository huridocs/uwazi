"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _util = require("util");
var _async = _interopRequireDefault(require("async"));
var _mongoose = require("mongoose");
var _date = _interopRequireDefault(require("../utils/date.js"));
var _model = _interopRequireDefault(require("./model"));
var _resultsModel = _interopRequireDefault(require("./resultsModel"));
var _api = _interopRequireDefault(require("./api"));
var _documents = _interopRequireDefault(require("../documents"));
var _workerManager = _interopRequireDefault(require("./workerManager"));
var _utils = require("../utils");
var _statuses = require("./statuses");
var _helpers = require("./helpers");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}






const SEARCH_BATCH_SIZE = 5;

const eachLimitAsync = (0, _util.promisify)(_async.default.eachLimit);

const processDocument = async (searchId, searchTerm, sharedId, language) => {
  const [doc] = await _documents.default.get({ sharedId, language }, '+fullText');

  await (0, _helpers.updateSearchDocumentStatus)(searchId, sharedId, _statuses.PROCESSING);
  const contents = await (0, _helpers.extractDocumentContent)(doc);
  if (!Object.keys(contents).length) {
    return (0, _helpers.updateSearchDocumentStatus)(searchId, sharedId, _statuses.COMPLETED);
  }

  const results = await _api.default.processDocument({
    searchTerm,
    contents });

  const savedResults = await (0, _helpers.setSearchDocumentResults)(searchId, sharedId, results);
  await (0, _helpers.updateSearchDocumentStatus)(searchId, sharedId, _statuses.COMPLETED);
  return savedResults;
};

const processSearchLimit = async (searchId, docLimit) => {
  const searchObject = await _model.default.save({ _id: searchId, status: _statuses.IN_PROGRESS });
  const { language, searchTerm } = searchObject;
  const docs = searchObject.documents.
  filter(doc => doc.status !== _statuses.COMPLETED);
  const docsToSearch = docs.length > docLimit ?
  docs.slice(0, docLimit) : docs;
  await eachLimitAsync(docsToSearch, SEARCH_BATCH_SIZE, async doc => processDocument(
  searchId, searchTerm, doc.sharedId, language));
  const updatedSearch = await _model.default.getById(searchId);
  const isNotDone = updatedSearch.documents.some(doc => doc.status !== _statuses.COMPLETED);
  if (isNotDone) {
    return { updatedSearch, processedDocuments: docsToSearch.map(d => d.sharedId) };
  }
  return {
    updatedSearch: await _model.default.save({ _id: searchId, status: _statuses.COMPLETED }),
    processedDocuments: docsToSearch.map(d => d.sharedId) };

};

const create = async (args, language, user) => {
  const docs = await (0, _helpers.getSearchDocuments)(args, language, user);
  const newSearch = {
    documents: docs.map(docId => ({
      sharedId: docId,
      status: _statuses.PENDING })),

    status: _statuses.PENDING,
    searchTerm: args.searchTerm,
    query: args.query,
    language,
    creationDate: _date.default.currentUTC() };

  const savedSearch = await _model.default.save(newSearch);
  _workerManager.default.notifyNewSearch(savedSearch._id);
  return savedSearch;
};

const getSearchResults = async (searchId, { skip = 0, limit = 30, threshold = 0.4, minRelevantSentences = 5 }) =>
_resultsModel.default.db.aggregate([
{
  $match: { searchId: _mongoose.Types.ObjectId(searchId) } },

{
  $project: {
    searchId: 1,
    sharedId: 1,
    status: 1,
    results: 1,
    totalResults: { $size: '$results' },
    numRelevant: { $size: { $filter: { input: '$results', as: 'result', cond: { $gte: ['$$result.score', threshold] } } } } } },


{
  $project: {
    totalResults: 1,
    searchId: 1,
    sharedId: 1,
    status: 1,
    results: 1,
    numRelevant: 1,
    relevantRate: { $divide: ['$numRelevant', '$totalResults'] } } },


{
  $match: { numRelevant: { $gte: minRelevantSentences } } },

{
  $sort: { relevantRate: -1 } },

{
  $skip: skip },

{
  $limit: limit }]);



const getSearch = async (searchId, args) => {
  const theSearch = await _model.default.getById(searchId);
  if (!theSearch) {
    throw (0, _utils.createError)('Search not found', 404);
  }

  const results = await getSearchResults(searchId, args);
  const docIds = results.map(r => r.sharedId);
  const docs = await _documents.default.get({ sharedId: { $in: docIds }, language: theSearch.language });
  const docsWithResults = results.map(result => _objectSpread({},

  docs.find(doc => doc.sharedId === result.sharedId), {
    semanticSearch: result }));


  theSearch.results = docsWithResults;
  return theSearch;
};

const listSearchResultsDocs = async (searchId, args) => {
  const theSearch = await _model.default.getById(searchId);
  if (!theSearch) {
    throw (0, _utils.createError)('Search not found', 404);
  }

  const { threshold, minRelevantSentences } = args;
  return _resultsModel.default.db.aggregate([
  { $match: { searchId: _mongoose.Types.ObjectId(searchId) } },
  {
    $project: {
      sharedId: 1,
      numRelevant: { $size: { $filter: { input: '$results', as: 'result', cond: { $gte: ['$$result.score', threshold] } } } } } },


  { $match: { numRelevant: { $gte: minRelevantSentences } } },
  { $lookup: { from: 'entities', localField: 'sharedId', foreignField: 'sharedId', as: 'document' } },
  { $unwind: '$document' },
  { $match: { 'document.language': theSearch.language } },
  { $project: { _id: 0, sharedId: 1, template: '$document.template' } }]);

};

const getDocumentResultsByIds = async (searchId, docIds) => {
  const theSearch = searchId._id ? searchId : await _model.default.getById(searchId);
  const results = await _resultsModel.default.get({ searchId, sharedId: { $in: docIds } });
  const docs = await _documents.default.get({ sharedId: { $in: docIds }, language: theSearch.language });
  const docsWithResults = docs.map(doc => _objectSpread({},

  doc, {
    semanticSearch: results.find(res => res.sharedId === doc.sharedId) }));


  return docsWithResults;
};

const getSearchesByDocument = async docId => {
  const results = await _resultsModel.default.get({ sharedId: docId });
  const searchPromises = results.map(({ searchId }) => _model.default.getById(searchId));
  const searches = await Promise.all(searchPromises);
  searches.map((theSearch, index) => _objectSpread({},
  theSearch, {
    results: results[index] }));

  return searches;
};

const deleteSearch = async searchId => {
  const res = await _model.default.delete(searchId);
  if (res.n !== 1) {
    throw (0, _utils.createError)('Search not found', 404);
  }
  await _resultsModel.default.delete({ searchId });
  return { deleted: true };
};

const stopSearch = async searchId => {
  const res = await _model.default.db.updateOne({
    _id: searchId,
    status: { $in: [_statuses.IN_PROGRESS, _statuses.PENDING] } },
  {
    $set: { status: _statuses.STOPPED } });

  if (!res.n) {
    throw (0, _utils.createError)('Only running searches can be stopped', 400);
  }
  return _model.default.getById(searchId);
};

const resumeSearch = async searchId => {
  const res = await _model.default.db.updateOne({
    _id: searchId,
    status: { $in: [_statuses.STOPPED] } },
  {
    $set: { status: _statuses.PENDING } });

  if (!res.n) {
    throw (0, _utils.createError)('Only stopped searches can be resumed', 400);
  }
  _workerManager.default.notifyNewSearch(searchId);
  return _model.default.getById(searchId);
};

const getAllDocumentResults = async searchId => _resultsModel.default.get({ searchId });
const getAllSearches = () => _model.default.get().sort('-creationDate');
const getInProgress = async () => _model.default.get({ status: _statuses.IN_PROGRESS }).sort('-creationDate');
const getPending = async () => _model.default.get({ status: _statuses.PENDING }).sort('-creationDate');

const semanticSearch = {
  _id: Math.random(),
  create,
  processDocument,
  processSearchLimit,
  getAllDocumentResults,
  getDocumentResultsByIds,
  getAllSearches,
  getPending,
  getInProgress,
  getSearchResults,
  getSearch,
  listSearchResultsDocs,
  getSearchesByDocument,
  deleteSearch,
  stopSearch,
  resumeSearch };var _default =


semanticSearch;exports.default = _default;