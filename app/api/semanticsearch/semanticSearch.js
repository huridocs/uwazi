import { promisify } from 'util';
import async from 'async';
import { search } from '../search';
import model from './model';
import resultsModel from './resultsModel';
import api from './api';
import documentsModel from '../documents';

const PENDING = 'pending';
const COMPLETED = 'completed';
const PROCESSING = 'processing';
const IN_PROGRESS = 'inProgress';

const SEARCH_BATCH_SIZE = 5;

const eachLimitAsync = promisify(async.eachLimit);

const getSearchDocuments = async ({ documents, query }, language, user) => {
  if (documents && documents.length) {
    return documents;
  }
  const res = await search.search(query, language, user);
  console.log('res', res);
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
  const docResults = await resultsModel.db.findOneAndUpdate({
    sharedId,
    searchId
  }, {
    sharedId,
    searchId,
    results,
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

const getDocumentResultsByID = async (searchId, sharedId) => {
  const [docResults] = await resultsModel.get({ searchId, sharedId });
  return docResults;
};

const processSearchLimit = async (searchId, docLimit) => {
  const searchObject = await updateSearchStatus(searchId, IN_PROGRESS);
  const { language, searchTerm } = searchObject;
  const docs = searchObject.documents
  .filter(doc => doc.status !== COMPLETED);
  const docsToSearch = docs.length > 5 ?
    docs.slice(0, docLimit) : docs;
  await eachLimitAsync(docsToSearch, SEARCH_BATCH_SIZE, async doc =>
    processDocument(searchId, searchTerm, doc.sharedId, language));
  return updateSearchStatus(searchId, COMPLETED);
};

const create = async (args, language, user) => {
  const docs = await getSearchDocuments(args, language, user);
  console.log('docs', docs, args);
  const newSearch = {
    documents: docs.map(docId => ({
      sharedId: docId,
      status: PENDING
    })),
    status: PENDING,
    searchTerm: args.searchTerm,
    language
  };
  return model.save(newSearch);
};

const semanticSearch = {
  create,
  processSearchLimit,
  getDocumentResultsByID
};

export default semanticSearch;
