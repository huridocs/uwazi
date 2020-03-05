import db from 'api/utils/testing_db';
import date from 'api/utils/date.js';
import workers from '../workerManager';
import semanticSearch from '../semanticSearch';
import model from '../model';
import resultsModel from '../resultsModel';
import api from '../api';
import * as helpers from '../helpers';

import fixtures, {
  search1Id,
  search2Id,
  search3Id,
  searchIdForFilters,
  doc1Id,
  docWithoutTextId,
} from './fixtures';
import { createError } from '../../utils';

describe('semanticSearch', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });
  afterAll(async () => {
    await db.disconnect();
  });

  describe('create', () => {
    beforeEach(() => {
      jest.spyOn(workers, 'notifyNewSearch').mockImplementation(() => {});
      jest.spyOn(helpers, 'getSearchDocuments');
    });
    afterEach(() => {
      workers.notifyNewSearch.mockClear();
    });
    it('should create and save new search', async () => {
      jest.spyOn(date, 'currentUTC').mockReturnValue(1000);
      const args = { searchTerm: 'Test term', documents: ['doc1', 'doc2'] };
      const created = await semanticSearch.create(args, 'en', 'user');
      const savedSearch = await model.getById(created._id);
      delete savedSearch._id;
      expect(helpers.getSearchDocuments).toHaveBeenCalledWith(args, 'en', 'user');
      expect(savedSearch).toMatchSnapshot();
    });
    it('should send the search to the workers', async () => {
      const args = { searchTerm: 'Test term', documents: ['doc1', 'doc2'] };
      const created = await semanticSearch.create(args, 'en', 'user');
      expect(workers.notifyNewSearch).toHaveBeenCalledWith(created._id);
    });
  });

  describe('processDocument', () => {
    let expectedResults;
    beforeEach(() => {
      expectedResults = [
        { page: 1, text: 'page 1', score: 0.2 },
        { page: 2, text: 'page 2', score: 0.6 },
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
          2: 'page 2',
        },
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
        docResults.results.map(({ page, text, score }) => ({ page, text, score }))
      ).toMatchSnapshot();
    });

    describe('if document has no fullText or rich text fields', () => {
      it('should mark as completed without processing', async () => {
        jest.spyOn(helpers, 'extractDocumentContent').mockResolvedValue({});
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
      { page: '1', text: 'page 1', score: 0.6 },
      { page: '2', text: 'page 2', score: 0.2 },
    ];
    beforeEach(() => {
      jest.spyOn(api, 'processDocument').mockResolvedValue(expectedResults);
      api.processDocument.mockClear();
    });

    it('should process only up to specified number of unprocessed docs in the search', async () => {
      helpers.extractDocumentContent.mockRestore();
      await semanticSearch.processSearchLimit(search2Id, 2);
      expect(api.processDocument).toHaveBeenCalledTimes(2);
      expect(api.processDocument).toHaveBeenCalledWith({
        searchTerm: 'injustice',
        contents: { 1: 'text2' },
      });
      expect(api.processDocument).toHaveBeenCalledWith({
        searchTerm: 'injustice',
        contents: { 1: 'text3' },
      });
      const theSearch = await model.getById(search2Id);
      expect(
        theSearch.documents.some(doc => doc.sharedId === 'doc2' && doc.status === 'completed')
      ).toBe(true);
      expect(
        theSearch.documents.some(doc => doc.sharedId === 'doc3' && doc.status === 'completed')
      ).toBe(true);
      expect(
        theSearch.documents.some(doc => doc.sharedId === 'doc5' && doc.status === 'pending')
      ).toBe(true);
      const res = await resultsModel.get({ searchId: search2Id });
      expect(res.some(r => r.sharedId === 'doc2')).toBe(true);
      expect(res.some(r => r.sharedId === 'doc3')).toBe(true);

      expect(theSearch.status).toBe('inProgress');
    });
    it('should return the updated search and processed documents', async () => {
      const res = await semanticSearch.processSearchLimit(search2Id, 2);
      expect(res.updatedSearch._id).toEqual(search2Id);
      delete res.updatedSearch._id;
      expect(res).toMatchSnapshot();
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
      expect(searches.length).toBe(4);
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
      expect(results.length).toEqual(3);
      expect(results.some(doc => doc.sharedId === 'doc1')).toBe(true);
      expect(results.some(doc => doc.sharedId === 'doc2')).toBe(true);
      expect(results.some(doc => doc.sharedId === 'doc3')).toBe(true);
    });
  });

  describe('getSearchResults', () => {
    it('should return search results filtered with the specified args and sorted by proportion of relevant docs', async () => {
      const args = {
        skip: 1,
        limit: 2,
        minRelevantSentences: 1,
        threshold: 0.6,
      };
      const results = await semanticSearch.getSearchResults(searchIdForFilters, args);
      expect(results.map(r => r.sharedId)).toEqual(['3', '2']);
      expect(
        results.map(r => {
          const withoutIds = { ...r };
          delete withoutIds._id;
          delete withoutIds.searchId;
          return withoutIds;
        })
      ).toMatchSnapshot();
    });
  });

  describe('getSearch', () => {
    it('should fetch a search by id and its document entities with filtered semantic search results', async () => {
      const res = await semanticSearch.getSearch(search3Id, {
        threshold: 0.5,
        minRelevantSentences: 1,
      });
      res.results.forEach(doc => {
        //eslint-disable-next-line no-param-reassign
        delete doc._id;
        //eslint-disable-next-line no-param-reassign
        delete doc.semanticSearch._id;
        //eslint-disable-next-line no-param-reassign
        delete doc.semanticSearch.searchId;
        //eslint-disable-next-line no-param-reassign
        delete doc.documents[0]._id;
      });
      delete res._id;
      expect(res.results.length).toBe(2);
      expect(res).toMatchSnapshot();
    });
    it('should return 404 if search does not exist', async () => {
      try {
        await semanticSearch.getSearch(db.id(), {});
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual(createError('Search not found', 404));
      }
    });
  });

  describe('listSearchResultsDocs', () => {
    it('should return the shared id and templates of all results that match the filters', async () => {
      const args = {
        minRelevantSentences: 2,
        threshold: 0.6,
      };
      const results = await semanticSearch.listSearchResultsDocs(searchIdForFilters, args);
      const docIds = results.map(r => r.sharedId);
      expect(results.length).toBe(3);
      expect(docIds.includes('2')).toBe(true);
      expect(docIds.includes('3')).toBe(true);
      expect(docIds.includes('4')).toBe(true);
      expect(results).toMatchSnapshot();
    });
  });

  describe('deleteSearch', () => {
    it('should delete specified search and its results', async () => {
      await semanticSearch.deleteSearch(search3Id);
      const searchInDb = await model.getById(search3Id);
      expect(searchInDb).toBeNull();
      const searchResults = await resultsModel.get({ searchId: search3Id });
      expect(searchResults.length).toBe(0);
    });
    it('should return 404 error if search does not exist', async () => {
      try {
        await semanticSearch.deleteSearch(db.id());
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual(createError('Search not found', 404));
      }
    });
  });

  describe('stopSearch', () => {
    const testErrorIfWrongStatus = async (searchId, status) => {
      try {
        await semanticSearch.stopSearch(searchId);
        fail('should throw error');
      } catch (e) {
        const theSearch = await model.getById(searchId);
        expect(theSearch.status).toBe(status);
        expect(e.code).toBe(400);
      }
    };
    it('should set status to stopped if search is pending', async () => {
      await semanticSearch.stopSearch(search2Id);
      const updatedSearch = await model.getById(search2Id);
      expect(updatedSearch.status).toBe('stopped');
    });
    it('should set status to stopped if search is in progress', async () => {
      await semanticSearch.stopSearch(search1Id);
      const updatedSearch = await model.getById(search1Id);
      expect(updatedSearch.status).toBe('stopped');
    });
    it('should return the updated search', async () => {
      const stoppedSearch = await semanticSearch.stopSearch(search1Id);
      expect(stoppedSearch.status).toBe('stopped');
    });
    it('should throw error if search is completed', async () => {
      await testErrorIfWrongStatus(search3Id, 'completed');
    });
    it('should throw error if search is stopped', async () => {
      await model.db.findOneAndUpdate({ _id: search3Id }, { $set: { status: 'stopped' } });
      await testErrorIfWrongStatus(search3Id, 'stopped');
    });
    it('should throw error if search does not exist', async () => {
      try {
        await semanticSearch.stopSearch(db.id());
        fail('should throw error');
      } catch (e) {
        expect(e.code).toBe(400);
      }
    });
  });

  describe('resumeSearch', () => {
    beforeEach(() => {
      jest.spyOn(workers, 'notifyNewSearch').mockImplementation(() => {});
    });
    const testErrorIfWrongStatus = async (searchId, status) => {
      await model.db.updateOne({ _id: searchId }, { $set: { status } });
      try {
        await semanticSearch.resumeSearch(searchId);
        fail('should throw error');
      } catch (e) {
        const theSearch = await model.getById(searchId);
        expect(theSearch.status).toBe(status);
        expect(e.code).toBe(400);
      }
    };
    it('should set status to pending if search is stopped', async () => {
      await model.db.updateOne({ _id: search1Id }, { $set: { status: 'stopped' } });
      await semanticSearch.resumeSearch(search1Id);
      const resumedSearch = await model.getById(search1Id);
      expect(resumedSearch.status).toBe('pending');
    });
    it('should notify workerManager', async () => {
      await model.db.updateOne({ _id: search1Id }, { $set: { status: 'stopped' } });
      await semanticSearch.resumeSearch(search1Id);
      expect(workers.notifyNewSearch).toHaveBeenCalledWith(search1Id);
    });
    it('should return the updated search', async () => {
      await model.db.updateOne({ _id: search1Id }, { $set: { status: 'stopped' } });
      const resumed = await semanticSearch.resumeSearch(search1Id);
      expect(resumed.status).toBe('pending');
    });
    it('should throw error if search is not stopped', async () => {
      const statuses = ['completed', 'pending', 'inProgress'];
      const searchIds = [search1Id, search2Id, search3Id];
      await Promise.all(
        statuses.map((status, index) => testErrorIfWrongStatus(searchIds[index], status))
      );
    });
  });
});
