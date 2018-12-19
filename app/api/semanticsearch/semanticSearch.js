import { promisify } from 'util';
import async from 'async';
import { search } from '../search';
import model from './model';
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
  return res.rows.map(document => document.sharedId);
};

const updateSearchDocument = async (searchId, sharedId, update) => {
  return model.db.findOneAndUpdate({
    _id: searchId,
    'documents.sharedId': sharedId
  }, update, { new: true, lean: true });
};

const processDocument = async (searchId, searchTerm, sharedId, language) => {
  const [doc] = await documentsModel.get({ sharedId, language }, '+fullText');
  const { fullText } = doc;
  await updateSearchDocument(searchId, sharedId, {
    $set: {
      'documents.$.status': PROCESSING
    }
  });
  if (!fullText) {
    return updateSearchDocument(searchId, sharedId, {
      $set: {
        'documents.$.status': COMPLETED
      }
    });
  }
  const results = await api.processDocument({
    searchTerm,
    contents: fullText
  });
  return updateSearchDocument(searchId, sharedId, {
    $set: {
      'documents.$.results': results,
      'documents.$.status': COMPLETED
    }
  });
};

const updateSearchStatus = (searchId, status) => model.save({
  _id: searchId,
  status
});

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
