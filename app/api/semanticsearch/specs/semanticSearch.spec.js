import db from 'api/utils/testing_db';
import workers from '../workerManager';
import semanticSearch from '../semanticSearch';
import { search } from '../../search';
import model from '../model';
import resultsModel from '../resultsModel';
import api from '../api';

import fixtures from './fixtures';
import { search1Id, doc1Id, docWithoutTextId } from './fixtures';

describe('semanticSearch', () => {
  beforeAll((done) => {
    db.clearAllAndLoad(fixtures).then(done);
  });
  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('create', () => {
    beforeEach(() => {
      jest.spyOn(workers, 'notifyNewSearch').mockImplementation(() => {});
    });
    it('should create and save new search', async () => {
      const args = { searchTerm: 'Test term', documents: ['doc1', 'doc2'] };
      const created = await semanticSearch.create(args, 'en', 'user');
      const savedSearch = await model.getById(created._id);
      delete savedSearch._id;
      expect(savedSearch).toMatchSnapshot();
    });
    it('should send the search to the workers', async () => {
      const args = { searchTerm: 'Test term', documents: ['doc1', 'doc2'] };
      const created = await semanticSearch.create(args, 'en', 'user');
      expect(workers.notifyNewSearch).toHaveBeenCalledWith(created._id);
    });
    describe('when query is provided instead of documents list', () => {
      it('should fetch the documents based on the query', async () => {
        jest.spyOn(search, 'search').mockResolvedValue({
          rows: [
            { sharedId: 'docA' },
            { sharedId: 'docB' }
          ]
        });
        const query = { filters: {} };
        const args = { searchTerm: 'term', query };
        const created = await semanticSearch.create(args, 'en', 'user');
        expect(search.search).toHaveBeenCalledWith(query, 'en', 'user');
        expect(created.documents).toEqual([
          { sharedId: 'docA', status: 'pending' },
          { sharedId: 'docB', status: 'pending' }
        ]);
      });
    });
  });

  describe('processDocument', () => {
    const expectedResults = [
      { page: 1, sentence: 'page 1', score: 0.6 },
      { page: 2, sentence: 'page 2', score: 0.2 }
    ];
    beforeEach(() => {
      jest.spyOn(api, 'processDocument').mockResolvedValue(expectedResults);
      api.processDocument.mockClear();
    });
    it('should send document to semantic search api for processing', async () => {
      await semanticSearch.processDocument(search1Id, 'legal', doc1Id, 'en');
      expect(api.processDocument).toHaveBeenCalledWith({
        searchTerm: 'legal',
        contents: {
          1: 'page 1',
          2: 'page 2'
        }
      });
    });
    it('should update the status of the document to be completed', async () => {
      await semanticSearch.processDocument(search1Id, 'legal', doc1Id, 'en');
      const theSearch = await model.getById(search1Id);
      const docInSearch = theSearch.documents.find(doc => doc.sharedId === doc1Id);
      expect(docInSearch.status).toBe('completed');
    });
    it('should save the results of the document', async () => {
      await semanticSearch.processDocument(search1Id, 'legal', doc1Id, 'en');
      const [docResults] = await resultsModel.get({ searchId: search1Id, sharedId: doc1Id });
      expect(docResults.status).toBe('completed');
      expect(
        docResults.results
        .map(({ page, sentence, score }) => ({ page, sentence, score }))
      ).toEqual(expectedResults);
    });
    describe('if document has no fullText', () => {
      it('should mark as completed without processing', async () => {
        await semanticSearch.processDocument(search1Id, 'legal', docWithoutTextId, 'en');
        expect(api.processDocument).not.toHaveBeenCalled();
        const theSearch = await model.getById(search1Id);
        const docInSearch = theSearch.documents.find(doc => doc.sharedId === docWithoutTextId);
        expect(docInSearch.status).toBe('completed');
        const docRes = await resultsModel.get({ searchId: search1Id, sharedId: docWithoutTextId });
        expect(docRes.length).toBe(0);
      });
    });
  });
});

