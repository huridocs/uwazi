import { search } from '../search';
import model from './model';
import resultsModel from './resultsModel';
import { COMPLETED } from './statuses';

export const getSearchDocuments = async ({ documents, query }, language, user) => {
  if (documents && documents.length) {
    return documents;
  }
  const _query = { ...query, limit: 9999, searchTerm: '' };
  const res = await search.search(_query, language, user);
  return res.rows.filter(doc => doc.file).map(doc => doc.sharedId);
};

export const removePageAnnotations = text => text.replace(/\[\[\d+\]\]/g, '');

export const updateSearchDocumentStatus = async (searchId, sharedId, status) => model.db.findOneAndUpdate({
  _id: searchId,
  'documents.sharedId': sharedId
}, {
  $set: { 'documents.$.status': status }
}, { new: true, lean: true });

export const setSearchDocumentResults = async (searchId, sharedId, results) => {
  const averageScore = results.reduce((total, curr) => total + curr.score, 0) / results.length;
  const _results = [...results];
  const docResults = await resultsModel.db.findOneAndUpdate({
    sharedId,
    searchId
  }, {
    sharedId,
    searchId,
    averageScore,
    results: _results.sort((r1, r2) => r2.score - r1.score),
    status: COMPLETED
  }, { upsert: true, new: true });
  return docResults;
};
