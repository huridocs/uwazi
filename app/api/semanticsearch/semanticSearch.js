import { promisify } from 'util';
import async from 'async';
import { Types } from 'mongoose';
import { search } from '../search';
import model from './model';
import resultsModel from './resultsModel';
import api from './api';
import documentsModel from '../documents';
import workers from './workerManager';
import { createError } from '../utils';

import date from 'api/utils/date.js';

export const PENDING = 'pending';
export const COMPLETED = 'completed';
export const PROCESSING = 'processing';
export const IN_PROGRESS = 'inProgress';
export const STOPPED = 'stopped';

const SEARCH_BATCH_SIZE = 5;

const eachLimitAsync = promisify(async.eachLimit);

const getSearchDocuments = async ({ documents, query }, language, user) => {
  if (documents && documents.length) {
    return documents;
  }
  const _query = { ...query, limit: 9999, searchTerm: '' };
  const res = await search.search(_query, language, user);
  return res.rows.map(document => document.sharedId);
};

const updateSearchDocumentStatus = async (searchId, sharedId, status) => model.db.findOneAndUpdate({
  _id: searchId,
  'documents.sharedId': sharedId
}, {
  $set: { 'documents.$.status': status }
}, { new: true, lean: true });

const setSearchDocumentResults = async (searchId, sharedId, results) => {
  const averageScore = results.reduce((total, curr) => total + curr.score, 0) / results.length;
  const docResults = await resultsModel.db.findOneAndUpdate({
    sharedId,
    searchId
  }, {
    sharedId,
    searchId,
    averageScore,
    results: results.sort((r1, r2) => r2.score - r1.score),
    status: COMPLETED
  }, { upsert: true, new: true });
  return docResults;
};

const removePageAnnotations = text => text.replace(/\[\[\d+\]\]/g, '');

const processDocument = async (searchId, searchTerm, sharedId, language) => {
  const [doc] = await documentsModel.get({ sharedId, language }, '+fullText');
  const { fullText } = doc;

  await updateSearchDocumentStatus(searchId, sharedId, PROCESSING);
  if (!fullText) {
    return updateSearchDocumentStatus(searchId, sharedId, COMPLETED);
  }
  Object.keys(fullText).forEach((page) => {
    fullText[page] = removePageAnnotations(fullText[page]);
  });
  const results = await api.processDocument({
    searchTerm,
    contents: fullText
  });
  const savedResults = await setSearchDocumentResults(searchId, sharedId, results);
  await updateSearchDocumentStatus(searchId, sharedId, COMPLETED);
  return savedResults;
};

const updateSearchStatus = (searchId, status) => model.save({
  _id: searchId,
  status
});

const getAllDocumentResults = async searchId => resultsModel.get({ searchId });

const processSearchLimit = async (searchId, docLimit) => {
  const searchObject = await updateSearchStatus(searchId, IN_PROGRESS);
  const { language, searchTerm } = searchObject;
  const docs = searchObject.documents
  .filter(doc => doc.status !== COMPLETED);
  const docsToSearch = docs.length > docLimit ?
    docs.slice(0, docLimit) : docs;
  await eachLimitAsync(docsToSearch, SEARCH_BATCH_SIZE, async doc => processDocument(
    searchId, searchTerm, doc.sharedId, language));
  const updatedSearch = await model.getById(searchId);
  const isNotDone = updatedSearch.documents.some(doc => doc.status !== COMPLETED);
  if (isNotDone) {
    return { updatedSearch, processedDocuments: docsToSearch.map(d => d.sharedId) };
  }
  return { updatedSearch: await updateSearchStatus(searchId, COMPLETED), processedDocuments: docsToSearch.map(d => d.sharedId) };
};

const create = async (args, language, user) => {
  const docs = await getSearchDocuments(args, language, user);
  const newSearch = {
    documents: docs.map(docId => ({
      sharedId: docId,
      status: PENDING
    })),
    status: PENDING,
    searchTerm: args.searchTerm,
    query: args.query,
    language,
    creationDate: date.currentUTC()
  };
  const savedSearch = await model.save(newSearch);
  workers.notifyNewSearch(savedSearch._id);
  return savedSearch;
};

const filterSearchResults = async (searchId, { skip = 0, limit = 50, threshold = 0.3, minRelevantSentences = 5 }) =>
  resultsModel.db.aggregate([
    {
      $match: { searchId: Types.ObjectId(searchId) }
    },
    {
      $project: {
        searchId: 1,
        sharedId: 1,
        status: 1,
        totalResults: { $size: '$results' },
        results: { $filter: { input: '$results', as: 'result', cond: { $gte: ['$$result.score', threshold] } } }
      }
    },
    {
      $project: {
        totalResults: 1,
        searchId: 1,
        sharedId: 1,
        status: 1,
        results: 1,
        numRelevant: { $size: '$results' },
        percentage: { $divide: [{ $size: '$results' }, '$totalResults'] }
      }
    },
    {
      $match: { numRelevant: { $gte: minRelevantSentences } }
    },
    {
      $sort: { percentage: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    }
  ]);

const getSearch = async (searchId) => {
  const theSearch = await model.getById(searchId);
  if (!theSearch) {
    throw createError('Search not found', 404);
  }
  const results = await filterSearchResults(searchId, {});
  const docIds = results.map(r => r.sharedId);
  const docs = await documentsModel.get({ sharedId: { $in: docIds }, language: theSearch.language });
  const docsWithResults = docs.map(doc => (
    {
      ...doc,
      semanticSearch: results.find(res => res.sharedId === doc.sharedId)
    }
  ));
  theSearch.results = docsWithResults;
  return theSearch;
};

const getDocumentResultsByIds = async (searchId, docIds) => {
  const theSearch = searchId._id ? searchId : await model.getById(searchId);
  const results = await resultsModel.get({ searchId, sharedId: { $in: docIds } });
  const docs = await documentsModel.get({ sharedId: { $in: docIds }, language: theSearch.language });
  const docsWithResults = docs.map(doc => (
    {
      ...doc,
      semanticSearch: results.find(res => res.sharedId === doc.sharedId)
    }
  ));
  return docsWithResults;
};

const getSearchesByDocument = async (docId) => {
  const results = await resultsModel.get({ sharedId: docId });
  const searchPromises = results.map(({ searchId }) => model.getById(searchId));
  const searches = await Promise.all(searchPromises);
  searches.map((theSearch, index) => ({
    ...theSearch,
    results: results[index]
  }));
  return searches;
};

const deleteSearch = async (searchId) => {
  const res = await model.delete(searchId);
  if (res.n !== 1) {
    throw createError('Search not found', 404);
  }
  await resultsModel.delete({ searchId });
  return { deleted: true };
};

const stopSearch = async (searchId) => {
  const res = await model.db.updateOne({
    _id: searchId,
    status: { $in: [IN_PROGRESS, PENDING] }
  }, {
    $set: { status: STOPPED }
  });
  if (!res.n) {
    throw createError('Only running searches can be stopped', 400);
  }
  return model.getById(searchId);
};

const resumeSearch = async (searchId) => {
  const res = await model.db.updateOne({
    _id: searchId,
    status: { $in: [STOPPED] }
  }, {
    $set: { status: PENDING }
  });
  if (!res.n) {
    throw createError('Only stopped searches can be resumed', 400);
  }
  workers.notifyNewSearch(searchId);
  return model.getById(searchId);
};

const getAllSearches = () => model.get().sort('-creationDate');
const getInProgress = async () => model.get({ status: IN_PROGRESS }).sort('-creationDate');
const getPending = async () => model.get({ status: PENDING }).sort('-creationDate');

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
  getSearch,
  getSearchesByDocument,
  deleteSearch,
  stopSearch,
  resumeSearch
};

export default semanticSearch;
