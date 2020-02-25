import { promisify } from 'util';
import async from 'async';
import { Types } from 'mongoose';
import date from 'api/utils/date.js';
import model from './model';
import resultsModel from './resultsModel';
import api from './api';
import documentsModel from '../documents';
import workers from './workerManager';
import { createError } from '../utils';
import { PENDING, COMPLETED, PROCESSING, IN_PROGRESS, STOPPED } from './statuses';
import {
  getSearchDocuments,
  updateSearchDocumentStatus,
  setSearchDocumentResults,
  extractDocumentContent,
} from './helpers';

const SEARCH_BATCH_SIZE = 5;

const eachLimitAsync = promisify(async.eachLimit);

const processDocument = async (searchId, searchTerm, sharedId, language) => {
  const [doc] = await documentsModel.get({ sharedId, language }, '+fullText');

  await updateSearchDocumentStatus(searchId, sharedId, PROCESSING);
  const contents = await extractDocumentContent(doc);
  if (!Object.keys(contents).length) {
    return updateSearchDocumentStatus(searchId, sharedId, COMPLETED);
  }

  const results = await api.processDocument({
    searchTerm,
    contents,
  });
  const savedResults = await setSearchDocumentResults(searchId, sharedId, results);
  await updateSearchDocumentStatus(searchId, sharedId, COMPLETED);
  return savedResults;
};

const processSearchLimit = async (searchId, docLimit) => {
  const searchObject = await model.save({ _id: searchId, status: IN_PROGRESS });
  const { language, searchTerm } = searchObject;
  const docs = searchObject.documents.filter(doc => doc.status !== COMPLETED);
  const docsToSearch = docs.length > docLimit ? docs.slice(0, docLimit) : docs;
  await eachLimitAsync(docsToSearch, SEARCH_BATCH_SIZE, async doc =>
    processDocument(searchId, searchTerm, doc.sharedId, language)
  );
  const updatedSearch = await model.getById(searchId);
  const isNotDone = updatedSearch.documents.some(doc => doc.status !== COMPLETED);
  if (isNotDone) {
    return { updatedSearch, processedDocuments: docsToSearch.map(d => d.sharedId) };
  }
  return {
    updatedSearch: await model.save({ _id: searchId, status: COMPLETED }),
    processedDocuments: docsToSearch.map(d => d.sharedId),
  };
};

const create = async (args, language, user) => {
  const docs = await getSearchDocuments(args, language, user);
  const newSearch = {
    documents: docs.map(docId => ({
      sharedId: docId,
      status: PENDING,
    })),
    status: PENDING,
    searchTerm: args.searchTerm,
    query: args.query,
    language,
    creationDate: date.currentUTC(),
  };
  const savedSearch = await model.save(newSearch);
  workers.notifyNewSearch(savedSearch._id);
  return savedSearch;
};

const getSearchResults = async (
  searchId,
  { skip = 0, limit = 30, threshold = 0.4, minRelevantSentences = 5 }
) =>
  resultsModel.db.aggregate([
    {
      $match: { searchId: Types.ObjectId(searchId) },
    },
    {
      $project: {
        searchId: 1,
        sharedId: 1,
        status: 1,
        results: 1,
        totalResults: { $size: '$results' },
        numRelevant: {
          $size: {
            $filter: {
              input: '$results',
              as: 'result',
              cond: { $gte: ['$$result.score', threshold] },
            },
          },
        },
      },
    },
    {
      $project: {
        totalResults: 1,
        searchId: 1,
        sharedId: 1,
        status: 1,
        results: 1,
        numRelevant: 1,
        relevantRate: { $divide: ['$numRelevant', '$totalResults'] },
      },
    },
    {
      $match: { numRelevant: { $gte: minRelevantSentences } },
    },
    {
      $sort: { relevantRate: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

const getSearch = async (searchId, args) => {
  const theSearch = await model.getById(searchId);
  if (!theSearch) {
    throw createError('Search not found', 404);
  }

  const results = await getSearchResults(searchId, args);
  const docIds = results.map(r => r.sharedId);
  const docs = await documentsModel.get({
    sharedId: { $in: docIds },
    language: theSearch.language,
  });
  const docsWithResults = results.map(result => ({
    ...docs.find(doc => doc.sharedId === result.sharedId),
    semanticSearch: result,
  }));
  theSearch.results = docsWithResults;
  return theSearch;
};

const listSearchResultsDocs = async (searchId, args) => {
  const theSearch = await model.getById(searchId);
  if (!theSearch) {
    throw createError('Search not found', 404);
  }

  const { threshold, minRelevantSentences } = args;
  return resultsModel.db.aggregate([
    { $match: { searchId: Types.ObjectId(searchId) } },
    {
      $project: {
        sharedId: 1,
        numRelevant: {
          $size: {
            $filter: {
              input: '$results',
              as: 'result',
              cond: { $gte: ['$$result.score', threshold] },
            },
          },
        },
      },
    },
    { $match: { numRelevant: { $gte: minRelevantSentences } } },
    {
      $lookup: {
        from: 'entities',
        localField: 'sharedId',
        foreignField: 'sharedId',
        as: 'document',
      },
    },
    { $unwind: '$document' },
    { $match: { 'document.language': theSearch.language } },
    { $project: { _id: 0, sharedId: 1, template: '$document.template' } },
  ]);
};

const getDocumentResultsByIds = async (searchId, docIds) => {
  const theSearch = searchId._id ? searchId : await model.getById(searchId);
  const results = await resultsModel.get({ searchId, sharedId: { $in: docIds } });
  const docs = await documentsModel.get({
    sharedId: { $in: docIds },
    language: theSearch.language,
  });
  const docsWithResults = docs.map(doc => ({
    ...doc,
    semanticSearch: results.find(res => res.sharedId === doc.sharedId),
  }));
  return docsWithResults;
};

const getSearchesByDocument = async docId => {
  const results = await resultsModel.get({ sharedId: docId });
  const searchPromises = results.map(({ searchId }) => model.getById(searchId));
  const searches = await Promise.all(searchPromises);
  searches.map((theSearch, index) => ({
    ...theSearch,
    results: results[index],
  }));
  return searches;
};

const deleteSearch = async searchId => {
  const res = await model.delete(searchId);
  if (res.n !== 1) {
    throw createError('Search not found', 404);
  }
  await resultsModel.delete({ searchId });
  return { deleted: true };
};

const stopSearch = async searchId => {
  const res = await model.db.updateOne(
    {
      _id: searchId,
      status: { $in: [IN_PROGRESS, PENDING] },
    },
    {
      $set: { status: STOPPED },
    }
  );
  if (!res.n) {
    throw createError('Only running searches can be stopped', 400);
  }
  return model.getById(searchId);
};

const resumeSearch = async searchId => {
  const res = await model.db.updateOne(
    {
      _id: searchId,
      status: { $in: [STOPPED] },
    },
    {
      $set: { status: PENDING },
    }
  );
  if (!res.n) {
    throw createError('Only stopped searches can be resumed', 400);
  }
  workers.notifyNewSearch(searchId);
  return model.getById(searchId);
};

const getAllDocumentResults = async searchId => resultsModel.get({ searchId });
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
  getSearchResults,
  getSearch,
  listSearchResultsDocs,
  getSearchesByDocument,
  deleteSearch,
  stopSearch,
  resumeSearch,
};

export default semanticSearch;
