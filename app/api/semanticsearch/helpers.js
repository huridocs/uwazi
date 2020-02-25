import { search } from '../search';
import model from './model';
import resultsModel from './resultsModel';
import { COMPLETED } from './statuses';
import templates from '../templates';

export const getSearchDocuments = async ({ documents, query }, language, user) => {
  if (documents && documents.length) {
    return documents;
  }
  const _query = { ...query, limit: 9999, searchTerm: '' };
  const res = await search.search(_query, language, user);
  return res.rows.map(doc => doc.sharedId);
};

export const removePageAnnotations = text => text.replace(/\[\[\d+\]\]/g, '');

export const updateSearchDocumentStatus = async (searchId, sharedId, status) =>
  model.db.findOneAndUpdate(
    {
      _id: searchId,
      'documents.sharedId': sharedId,
    },
    {
      $set: { 'documents.$.status': status },
    },
    { new: true, lean: true }
  );

export const setSearchDocumentResults = async (searchId, sharedId, results) => {
  const averageScore = results.length
    ? results.reduce((total, curr) => total + curr.score, 0) / results.length
    : 0;
  const _results = [...results];
  const docResults = await resultsModel.db.findOneAndUpdate(
    {
      sharedId,
      searchId,
    },
    {
      sharedId,
      searchId,
      averageScore,
      results: _results.sort((r1, r2) => r2.score - r1.score),
      status: COMPLETED,
    },
    { upsert: true, new: true }
  );
  return docResults;
};

export const extractDocumentContent = async doc => {
  const { fullText, metadata } = doc;
  const contents = {};

  if (metadata) {
    const template = await templates.getById(doc.template);
    const metadataFields = template.properties.filter(prop => prop.type === 'markdown');

    metadataFields.forEach(field => {
      if (metadata[field.name]) {
        contents[field.name] = metadata[field.name];
      }
    });
  }

  if (fullText) {
    Object.keys(fullText).forEach(page => {
      contents[page] = removePageAnnotations(fullText[page]);
    });
  }

  return contents;
};
