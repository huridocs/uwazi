import { promisify } from 'util';
import async from 'async';
import { search } from '../search';
import model from './model';
import resultsModel from './resultsModel';
import api from './api';
import documentsModel from '../documents';
import workers from './workerManager';
import { createError } from '../utils';

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
  const res = await search.search(query, language, user);
  return res.rows.map(document => document.sharedId);
};

const updateSearchDocumentStatus = async (searchId, sharedId, status) => {
  return model.db.findOneAndUpdate({
    _id: searchId,
    'documents.sharedId': sharedId
  }, {
    $set: { 'documents.$.status': status }
  }, { new: true, lean: true });
};

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

const processDocument = async (searchId, searchTerm, sharedId, language) => {
  const [doc] = await documentsModel.get({ sharedId, language }, '+fullText');
  const { fullText } = doc;
  await updateSearchDocumentStatus(searchId, sharedId, PROCESSING);
  if (!fullText) {
    return updateSearchDocumentStatus(searchId, sharedId, COMPLETED);
  }
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
  await eachLimitAsync(docsToSearch, SEARCH_BATCH_SIZE, async doc =>
    processDocument(searchId, searchTerm, doc.sharedId, language));
  const updatedSearch = await model.getById(searchId);
  const isNotDone = updatedSearch.documents.some(doc => doc.status !== COMPLETED);
  const newStatus = isNotDone ? IN_PROGRESS : COMPLETED;
  return updateSearchStatus(searchId, newStatus);
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
    language
  };
  const savedSearch = await model.save(newSearch);
  workers.notifyNewSearch(savedSearch._id);
  return savedSearch;
};

const getSearch = async (searchId) => {
  const theSearch = await model.getById(searchId);
  if (!theSearch) {
    throw createError('Search not found', 404);
  }
  const results = await resultsModel.get({ searchId });
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
    throw createError('No matching pending search found', 404);
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
    throw createError('No matching stopped search found', 404);
  }
  return model.getById(searchId);
};

const getAllSearches = () => model.get();
const getInProgress = async () => model.get({ status: IN_PROGRESS });
const getPending = async () => model.get({ status: PENDING });

const semanticSearch = {
  create,
  processDocument,
  processSearchLimit,
  getAllDocumentResults,
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
