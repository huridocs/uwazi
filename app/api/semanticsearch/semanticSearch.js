import { search } from '../search';
import model from './model';

const PENDING = 'pending';

const getSearchDocuments = async ({ documents, query }, language, user) => {
  if (documents && documents.length) {
    return documents;
  }
  const res = await search.search(query, language, user);
  return res.rows.map(document => document.sharedId);
};

const semanticSearch = {
  async search(args, language, user) {
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
  }
};

export default semanticSearch;
