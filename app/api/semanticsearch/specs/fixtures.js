import db from 'api/utils/testing_db';

const search1Id = db.id();
const search2Id = db.id();
const search3Id = db.id();
const searchIdForFilters = db.id();
const doc1ObjectId = db.id();
const doc1Id = 'doc1';
const docWithoutTextId = 'docWithoutText';
const template1Id = db.id();

export default {
  semanticsearches: [
    {
      _id: search1Id,
      searchTerm: 'legal',
      status: 'inProgress',
      language: 'en',
      documents: [
        { sharedId: doc1Id, status: 'pending' },
        { sharedId: docWithoutTextId, status: 'pending' },
      ],
    },
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
        { sharedId: 'doc5', status: 'pending' },
      ],
    },
    {
      _id: search3Id,
      searchTerm: 'torture',
      status: 'completed',
      language: 'en',
      documents: [
        { sharedId: 'doc1', status: 'completed' },
        { sharedId: 'doc2', status: 'completed' },
      ],
    },
    {
      _id: searchIdForFilters,
      language: 'en',
    },
  ],
  entities: [
    {
      _id: doc1ObjectId,
      sharedId: doc1Id,
      language: 'en',
      fullText: { 1: 'page 1', 2: 'page 2' },
    },
    {
      _id: db.id(),
      sharedId: docWithoutTextId,
      language: 'en',
    },
    {
      _id: db.id(),
      sharedId: 'doc2',
      language: 'en',
      fullText: { 1: 'text2' },
    },
    {
      _id: db.id(),
      sharedId: 'doc3',
      language: 'en',
      fullText: { 1: 'text3' },
    },
    {
      _id: db.id(),
      sharedId: 'doc4',
      language: 'en',
      fullText: { 1: 'text4' },
    },
    {
      _id: db.id(),
      sharedId: 'doc5',
      language: 'en',
      fullText: { 1: 'text5' },
    },
    {
      sharedId: '1',
      template: 't1',
      language: 'en',
    },
    {
      sharedId: '2',
      template: 't2',
      language: 'en',
    },
    {
      sharedId: '3',
      template: 't3',
      language: 'en',
    },
    {
      sharedId: '3',
      template: 't3',
      language: 'es',
    },
    {
      sharedId: '4',
      template: 't4',
      language: 'en',
    },
    {
      sharedId: '5',
      template: 't5',
      language: 'en',
    },
    {
      sharedId: '5',
      template: 't5',
      language: 'es',
    },
  ],
  templates: [
    {
      _id: template1Id,
      commonProperties: [],
      properties: [
        { name: 'description', type: 'markdown' },
        { name: 'code', type: 'text' },
        { name: 'bio', type: 'markdown' },
      ],
    },
  ],
  semanticsearchresults: [
    {
      _id: db.id(),
      searchId: search3Id,
      sharedId: 'doc1',
      results: [
        { page: 1, sentence: 'stuff', score: 0.5 },
        { page: 2, sentence: 'this', score: 0.2 },
      ],
    },
    {
      _id: db.id(),
      searchId: search3Id,
      sharedId: 'doc2',
      results: [
        { page: 1, sentence: 'that', score: 0.8 },
        { page: 4, sentence: 'then', score: 0.6 },
        { page: 2, sentence: 'what', score: 0.1 },
      ],
    },
    {
      _id: db.id(),
      searchId: search3Id,
      sharedId: 'doc3',
      results: [
        { page: 1, sentence: 'that', score: 0.4 },
        { page: 1, sentence: 'then', score: 0.3 },
      ],
    },
    {
      _id: db.id(),
      searchId: db.id(),
      sharedId: 'someOtherDoc',
      results: [],
    },
    {
      searchId: searchIdForFilters,
      sharedId: '1',
      status: 'completed',
      documents: [],
      results: [{ score: 0.4 }, { score: 0.2 }, { score: 0.3 }],
    },
    {
      searchId: searchIdForFilters,
      sharedId: '2',
      status: 'completed',
      documents: [],
      results: [{ score: 0.7 }, { score: 0.9 }, { score: 0.3 }],
    },
    {
      searchId: searchIdForFilters,
      sharedId: '3',
      status: 'completed',
      documents: [],
      results: [{ score: 0.8 }, { score: 0.2 }, { score: 0.67 }, { score: 0.71 }],
    },
    {
      searchId: searchIdForFilters,
      sharedId: '4',
      status: 'completed',
      documents: [],
      results: [{ score: 0.67 }, { score: 0.92 }, { score: 0.74 }, { score: 0.8 }],
    },
    {
      searchId: searchIdForFilters,
      sharedId: '5',
      status: 'completed',
      documents: [],
      results: [{ score: 0.9 }, { score: 0.2 }, { score: 0.3 }],
    },
  ],
};

export {
  search1Id,
  search2Id,
  search3Id,
  searchIdForFilters,
  doc1ObjectId,
  doc1Id,
  docWithoutTextId,
  template1Id,
};
