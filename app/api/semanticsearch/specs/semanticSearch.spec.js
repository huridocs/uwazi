import db from 'api/utils/testing_db';
import workers from '../workerManager';
import semanticSearch from '../semanticSearch';
import { search } from '../../search';
import model from '../model';
import resultsModel from '../resultsModel';
import api from '../api';

import fixtures from './fixtures';
import { search1Id, search2Id, search3Id, doc1Id, docWithoutTextId } from './fixtures';
import { createError } from '../../utils';

describe('semanticSearch', () => {
  beforeEach((done) => {
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
    let expectedResults;
    beforeEach(() => {
      expectedResults = [
        { page: 1, text: 'page 1', score: 0.2 },
        { page: 2, text: 'page 2', score: 0.6 }
      ];
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
    it('should save the results of the document sorted by score in descending order, and compute average score', async () => {
      await semanticSearch.processDocument(search1Id, 'legal', doc1Id, 'en');
      const [docResults] = await resultsModel.get({ searchId: search1Id, sharedId: doc1Id });
      expect(docResults.status).toBe('completed');
      expect(docResults.averageScore).toBe((0.2 + 0.6) / 2);
      expect(
        docResults.results
        .map(({ page, text, score }) => ({ page, text, score }))
      ).toMatchSnapshot();
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

  describe('processSearchLimit', () => {
    const expectedResults = [
      { page: 1, text: 'page 1', score: 0.6 },
      { page: 2, text: 'page 2', score: 0.2 }
    ];
    beforeEach(() => {
      jest.spyOn(api, 'processDocument').mockResolvedValue(expectedResults);
      api.processDocument.mockClear();
    });
    it('should process only up to specified number of unprocessed docs in the search', async () => {
      await semanticSearch.processSearchLimit(search2Id, 2);
      expect(api.processDocument).toHaveBeenCalledTimes(2);
      expect(api.processDocument).toHaveBeenCalledWith({
        searchTerm: 'injustice',
        contents: { 1: 'text2' }
      });
      expect(api.processDocument).toHaveBeenCalledWith({
        searchTerm: 'injustice',
        contents: { 1: 'text3' }
      });
      const theSearch = await model.getById(search2Id);
      expect(theSearch.documents.some(
        doc => doc.sharedId === 'doc2' && doc.status === 'completed')).toBe(true);
      expect(theSearch.documents.some(
        doc => doc.sharedId === 'doc3' && doc.status === 'completed')).toBe(true);
      expect(theSearch.documents.some(
        doc => doc.sharedId === 'doc5' && doc.status === 'pending')).toBe(true);
      const res = await resultsModel.get({ searchId: search2Id });
      expect(res.some(r => r.sharedId === 'doc2')).toBe(true);
      expect(res.some(r => r.sharedId === 'doc3')).toBe(true);

      expect(theSearch.status).toBe('inProgress');
    });
    it('should mark search as complete if all documents are processed', async () => {
      await semanticSearch.processSearchLimit(search2Id, 5);
      const theSearch = await model.getById(search2Id);
      expect(theSearch.status).toBe('completed');
    });
  });

  describe('getAllSearches', () => {
    it('should return all searches', async () => {
      const searches = await semanticSearch.getAllSearches();
      expect(searches[0]._id).toEqual(search1Id);
      expect(searches.length).toBe(3);
    });
  });

  describe('getPending', () => {
    it('should return pending searches', async () => {
      const pending = await semanticSearch.getPending();
      expect(pending.length).toBe(1);
      expect(pending[0]._id).toEqual(search2Id);
    });
  });

  describe('getInProgress', () => {
    it('should return all searches in progress', async () => {
      const inProgress = await semanticSearch.getInProgress();
      expect(inProgress.length).toBe(1);
      expect(inProgress[0]._id).toEqual(search1Id);
    });
  });

  describe('getAllDocumentResults', () => {
    it('should return all document results of the specified search', async () => {
      const results = await semanticSearch.getAllDocumentResults(search3Id);
      expect(results.length).toEqual(2);
      expect(results.some(doc => doc.sharedId === 'doc1')).toBe(true);
      expect(results.some(doc => doc.sharedId === 'doc2')).toBe(true);
    });
  });

  describe('getSearch', () => {
    it('should fetch a search by id and its document entities with semantic search results', async () => {
      const res = await semanticSearch.getSearch(search3Id);
      res.results.forEach((doc) => {
        //eslint-disable-next-line no-param-reassign
        delete doc._id;
        //eslint-disable-next-line no-param-reassign
        delete doc.semanticSearch._id;
        //eslint-disable-next-line no-param-reassign
        delete doc.semanticSearch.searchId;
      });
      delete res._id;
      expect(res.results.length).toBe(2);
      expect(res).toMatchSnapshot();
    });
    it('should return 404 if search does not exist', async () => {
      try {
        await semanticSearch.getSearch(db.id());
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual(createError('Search not found', 404));
      }
    });
  });
});

