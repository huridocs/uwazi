import { promisify } from 'util';
import async from 'async';
import { search } from '../search';
import model from './model';
import api from './api';
import documentsModel from '../documents';

const eachLimitAsync = promisify(async.eachLimit);

const PENDING = 'pending';
const COMPLETED = 'completed';
const PROCESSING = 'processing';
const IN_PROGRESS = 'inProgress';

const getSearchDocuments = async ({ documents, query }, language, user) => {
  if (documents && documents.length) {
    return documents;
  }
  const res = await search.search(query, language, user);
  return res.rows.map(document => document.sharedId);
};

const updateSearchDocument = async (searchId, sharedId, update) => {
  return model.db.findOneAndUpdate({
    _id: searchId,
    'documents.sharedId': sharedId
  }, update, { new: true, lean: true });
};

const processDocument = async (searchId, sharedId, language) => {
  const doc = await documentsModel.getById(sharedId, language);
  const { fullText } = doc;
  await updateSearchDocument(searchId, sharedId, {
    $set: {
      'documents.$.status': PROCESSING
    }
  });
  const results = await api.processDocument(fullText);
  return updateSearchDocument(searchId, sharedId, {
    $set: {
      'documents.$.results': results,
      'documents.$.status': COMPLETED
    }
  });
};

const updateSearchStatus = (searchId, status) => model.update({
  _id: searchId,
  status
});

const processSearchLimit = async (searchId, docLimit) => {
  const searchObject = await updateSearchStatus(IN_PROGRESS);
  const { language } = searchObject;
  const docs = searchObject.documents
  .filter(doc => doc.status !== COMPLETED);
  const docsToSearch = docs.length > 5 ?
    docs.slice(0, docLimit) : docs;
  await eachLimitAsync(docsToSearch, async doc =>
    processDocument(searchId, doc.sharedId, language));
  return updateSearchStatus(searchId, COMPLETED);
};

const create = async (args, language, user) => {
  const docs = await getSearchDocuments(args, language, user);
  const newSearch = {
    documents: docs.map(docId => ({
      sharedId: docId,
      results: [],
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
  processSearchLimit
};

export default semanticSearch;
