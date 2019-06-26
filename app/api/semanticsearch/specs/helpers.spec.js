import db from 'api/utils/testing_db';
import { search } from '../../search';
import * as helpers from '../helpers';
import model from '../model';
import resultsModel from '../resultsModel';
import fixtures, { search2Id } from './fixtures';

describe('semanticSearch helpers', () => {
  beforeEach((done) => {
    db.clearAllAndLoad(fixtures).then(done);
  });
  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('removePageAnnotations', () => {
    it('should remove page number annotations from a piece of text', () => {
      const input = 'this[[1]] is a test[[2]]';
      const output = helpers.removePageAnnotations(input);
      expect(output).toBe('this is a test');
    });
  });

  describe('getSearchDocuments', () => {
    let user;
    let language;
    let args;

    beforeEach(() => {
      user = 'user';
      language = 'en';
      args = {
        documents: [],
        query: {
          limit: 30,
          searchTerm: 'test',
          filters: {}
        }
      };
      jest.spyOn(search, 'search').mockResolvedValue({ rows: [] });
    });

    const getSearchDocs = () => helpers.getSearchDocuments(args, language, user);

    describe('when specific documents are specified is specified', () => {
      it('should return the specified documents', async () => {
        args.documents = ['doc1', 'doc2'];
        const result = await getSearchDocs();
        expect(result).toEqual(['doc1', 'doc2']);
      });
    });

    describe('when documents array is empty', () => {
      it('should call search.search with query and set limit to 9999 and searchTerm to empty', async () => {
        await getSearchDocs();
        expect(search.search).toHaveBeenCalledWith(
          { ...args.query, limit: 9999, searchTerm: '' },
          language,
          user
        );
      });

      it('should return only document ids of documents with files', async () => {
        jest.spyOn(search, 'search').mockResolvedValue({
          rows: [
            { sharedId: 'doc1', file: {} },
            { sharedId: 'doc2' },
            { sharedId: 'doc3', file: {} }
          ]
        });
        const res = await getSearchDocs();
        expect(res).toEqual(['doc1', 'doc3']);
      });
    });
  });

  describe('updateSearchDocumentResults', () => {
    it('should update the status of the specified document in the semantic search', async () => {
      await helpers.updateSearchDocumentStatus(search2Id, 'doc2', 'completed');
      const res = await model.db.findOne({ _id: search2Id });
      expect(res.documents.find(doc => doc.sharedId === 'doc2').status).toBe('completed');
    });
  });

  describe('searchSearchDocumentResults', () => {
    const areResultsEqual = (a, b) => a.text === b.text && a.page === b.page && a.score === b.score;

    it('should set the results of the specified document sorted by higher score', async () => {
      const results = [{ page: 10, text: 't1', score: 0.2 }, { page: 20, text: 't2', score: 0.6 }];
      const searchId = db.id();
      await helpers.setSearchDocumentResults(searchId, 'doc1', results);
      const res = await resultsModel.db.findOne({ searchId, sharedId: 'doc1' });
      expect(areResultsEqual(res.results[0], results[1])).toBe(true);
      expect(areResultsEqual(res.results[1], results[0])).toBe(true);
      expect(res.averageScore).toBe(0.4);
      expect(res.status).toBe('completed');
    });
  });
});
