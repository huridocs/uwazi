"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.template1Id = exports.docWithoutTextId = exports.doc1Id = exports.doc1ObjectId = exports.searchIdForFilters = exports.search3Id = exports.search2Id = exports.search1Id = exports.default = void 0;var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const search1Id = _testing_db.default.id();exports.search1Id = search1Id;
const search2Id = _testing_db.default.id();exports.search2Id = search2Id;
const search3Id = _testing_db.default.id();exports.search3Id = search3Id;
const searchIdForFilters = _testing_db.default.id();exports.searchIdForFilters = searchIdForFilters;
const doc1ObjectId = _testing_db.default.id();exports.doc1ObjectId = doc1ObjectId;
const doc1Id = 'doc1';exports.doc1Id = doc1Id;
const docWithoutTextId = 'docWithoutText';exports.docWithoutTextId = docWithoutTextId;
const template1Id = _testing_db.default.id();exports.template1Id = template1Id;var _default =

{
  semanticsearches: [
  {
    _id: search1Id,
    searchTerm: 'legal',
    status: 'inProgress',
    language: 'en',
    documents: [
    { sharedId: doc1Id, status: 'pending' },
    { sharedId: docWithoutTextId, status: 'pending' }] },


  {
    _id: search2Id,
    searchTerm: 'injustice',
    status: 'pending',
    language: 'en',
    documents: [
    { sharedId: 'doc1', status: 'completed' },
    { sharedId: 'doc2', status: 'pending' },
    { sharedId: 'doc3', status: 'pending' },
    { sharedId: 'doc4', status: 'completed' },
    { sharedId: 'doc5', status: 'pending' }] },


  {
    _id: search3Id,
    searchTerm: 'torture',
    status: 'completed',
    language: 'en',
    documents: [
    { sharedId: 'doc1', status: 'completed' },
    { sharedId: 'doc2', status: 'completed' }] },


  {
    _id: searchIdForFilters,
    language: 'en' }],


  entities: [
  {
    _id: doc1ObjectId, sharedId: doc1Id, language: 'en',
    fullText: { 1: 'page 1', 2: 'page 2' } },

  {
    _id: _testing_db.default.id(), sharedId: docWithoutTextId, language: 'en' },

  {
    _id: _testing_db.default.id(), sharedId: 'doc2', language: 'en',
    fullText: { 1: 'text2' } },

  {
    _id: _testing_db.default.id(), sharedId: 'doc3', language: 'en',
    fullText: { 1: 'text3' } },

  {
    _id: _testing_db.default.id(), sharedId: 'doc4', language: 'en',
    fullText: { 1: 'text4' } },

  {
    _id: _testing_db.default.id(), sharedId: 'doc5', language: 'en',
    fullText: { 1: 'text5' } },

  {
    sharedId: '1',
    template: 't1',
    language: 'en' },

  {
    sharedId: '2',
    template: 't2',
    language: 'en' },

  {
    sharedId: '3',
    template: 't3',
    language: 'en' },

  {
    sharedId: '3',
    template: 't3',
    language: 'es' },

  {
    sharedId: '4',
    template: 't4',
    language: 'en' },

  {
    sharedId: '5',
    template: 't5',
    language: 'en' },

  {
    sharedId: '5',
    template: 't5',
    language: 'es' }],


  templates: [
  {
    _id: template1Id,
    commonProperties: [],
    properties: [
    { name: 'description', type: 'markdown' },
    { name: 'code', type: 'text' },
    { name: 'bio', type: 'markdown' }] }],



  semanticsearchresults: [
  {
    _id: _testing_db.default.id(),
    searchId: search3Id,
    sharedId: 'doc1',
    results: [
    { page: 1, sentence: 'stuff', score: 0.5 },
    { page: 2, sentence: 'this', score: 0.2 }] },


  {
    _id: _testing_db.default.id(),
    searchId: search3Id,
    sharedId: 'doc2',
    results: [
    { page: 1, sentence: 'that', score: 0.8 },
    { page: 4, sentence: 'then', score: 0.6 },
    { page: 2, sentence: 'what', score: 0.1 }] },


  {
    _id: _testing_db.default.id(),
    searchId: search3Id,
    sharedId: 'doc3',
    results: [
    { page: 1, sentence: 'that', score: 0.4 },
    { page: 1, sentence: 'then', score: 0.3 }] },


  {
    _id: _testing_db.default.id(),
    searchId: _testing_db.default.id(),
    sharedId: 'someOtherDoc',
    results: [] },

  {
    searchId: searchIdForFilters,
    sharedId: '1',
    status: 'completed',
    documents: [],
    results: [{ score: 0.4 }, { score: 0.2 }, { score: 0.3 }] },

  {
    searchId: searchIdForFilters,
    sharedId: '2',
    status: 'completed',
    documents: [],
    results: [{ score: 0.7 }, { score: 0.9 }, { score: 0.3 }] },

  {
    searchId: searchIdForFilters,
    sharedId: '3',
    status: 'completed',
    documents: [],
    results: [{ score: 0.8 }, { score: 0.2 }, { score: 0.67 }, { score: 0.71 }] },

  {
    searchId: searchIdForFilters,
    sharedId: '4',
    status: 'completed',
    documents: [],
    results: [{ score: 0.67 }, { score: 0.92 }, { score: 0.74 }, { score: 0.8 }] },

  {
    searchId: searchIdForFilters,
    sharedId: '5',
    status: 'completed',
    documents: [],
    results: [{ score: 0.9 }, { score: 0.2 }, { score: 0.3 }] }] };exports.default = _default;