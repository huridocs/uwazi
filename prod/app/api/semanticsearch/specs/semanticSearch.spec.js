"use strict";var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _date = _interopRequireDefault(require("../../utils/date.js"));
var _workerManager = _interopRequireDefault(require("../workerManager"));
var _semanticSearch = _interopRequireDefault(require("../semanticSearch"));
var _model = _interopRequireDefault(require("../model"));
var _resultsModel = _interopRequireDefault(require("../resultsModel"));
var _api = _interopRequireDefault(require("../api"));
var helpers = _interopRequireWildcard(require("../helpers"));

var _fixtures = _interopRequireWildcard(require("./fixtures"));
var _utils = require("../../utils");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

describe('semanticSearch', () => {
  beforeEach(done => {
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done);
  });
  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('create', () => {
    beforeEach(() => {
      jest.spyOn(_workerManager.default, 'notifyNewSearch').mockImplementation(() => {});
      jest.spyOn(helpers, 'getSearchDocuments');
    });
    afterEach(() => {
      _workerManager.default.notifyNewSearch.mockClear();
    });
    it('should create and save new search', async () => {
      jest.spyOn(_date.default, 'currentUTC').mockReturnValue(1000);
      const args = { searchTerm: 'Test term', documents: ['doc1', 'doc2'] };
      const created = await _semanticSearch.default.create(args, 'en', 'user');
      const savedSearch = await _model.default.getById(created._id);
      delete savedSearch._id;
      expect(helpers.getSearchDocuments).toHaveBeenCalledWith(args, 'en', 'user');
      expect(savedSearch).toMatchSnapshot();
    });
    it('should send the search to the workers', async () => {
      const args = { searchTerm: 'Test term', documents: ['doc1', 'doc2'] };
      const created = await _semanticSearch.default.create(args, 'en', 'user');
      expect(_workerManager.default.notifyNewSearch).toHaveBeenCalledWith(created._id);
    });
  });

  describe('processDocument', () => {
    let expectedResults;
    beforeEach(() => {
      expectedResults = [
      { page: 1, text: 'page 1', score: 0.2 },
      { page: 2, text: 'page 2', score: 0.6 }];

      jest.spyOn(_api.default, 'processDocument').mockResolvedValue(expectedResults);
      jest.spyOn(helpers, 'extractDocumentContent').mockResolvedValue({
        1: 'page 1',
        2: 'page 2' });

      _api.default.processDocument.mockClear();
    });
    afterEach(() => {
      helpers.extractDocumentContent.mockRestore();
    });
    it('should send document to semantic search api for processing', async () => {
      await _semanticSearch.default.processDocument(_fixtures.search1Id, 'legal', _fixtures.doc1Id, 'en');
      expect(helpers.extractDocumentContent).toHaveBeenCalledWith({
        _id: _fixtures.doc1ObjectId,
        sharedId: _fixtures.doc1Id,
        fullText: { 1: 'page 1', 2: 'page 2' },
        language: 'en' });

      expect(_api.default.processDocument).toHaveBeenCalledWith({
        searchTerm: 'legal',
        contents: {
          1: 'page 1',
          2: 'page 2' } });


    });
    it('should update the status of the document to be completed', async () => {
      await _semanticSearch.default.processDocument(_fixtures.search1Id, 'legal', _fixtures.doc1Id, 'en');
      const theSearch = await _model.default.getById(_fixtures.search1Id);
      const docInSearch = theSearch.documents.find(doc => doc.sharedId === _fixtures.doc1Id);
      expect(docInSearch.status).toBe('completed');
    });
    it('should save the results of the document sorted by score in descending order, and compute average score', async () => {
      await _semanticSearch.default.processDocument(_fixtures.search1Id, 'legal', _fixtures.doc1Id, 'en');
      const [docResults] = await _resultsModel.default.get({ searchId: _fixtures.search1Id, sharedId: _fixtures.doc1Id });
      expect(docResults.status).toBe('completed');
      expect(docResults.averageScore).toBe((0.2 + 0.6) / 2);
      expect(
      docResults.results.
      map(({ page, text, score }) => ({ page, text, score }))).
      toMatchSnapshot();
    });
    describe('if document has no fullText or rich text fields', () => {
      it('should mark as completed without processing', async () => {
        jest.spyOn(helpers, 'extractDocumentContent').mockResolvedValue({});
        await _semanticSearch.default.processDocument(_fixtures.search1Id, 'legal', _fixtures.docWithoutTextId, 'en');
        expect(_api.default.processDocument).not.toHaveBeenCalled();
        const theSearch = await _model.default.getById(_fixtures.search1Id);
        const docInSearch = theSearch.documents.find(doc => doc.sharedId === _fixtures.docWithoutTextId);
        expect(docInSearch.status).toBe('completed');
        const docRes = await _resultsModel.default.get({ searchId: _fixtures.search1Id, sharedId: _fixtures.docWithoutTextId });
        expect(docRes.length).toBe(0);
      });
    });
  });

  describe('processSearchLimit', () => {
    const expectedResults = [
    { page: '1', text: 'page 1', score: 0.6 },
    { page: '2', text: 'page 2', score: 0.2 }];

    beforeEach(() => {
      jest.spyOn(_api.default, 'processDocument').mockResolvedValue(expectedResults);
      _api.default.processDocument.mockClear();
    });
    it('should process only up to specified number of unprocessed docs in the search', async () => {
      await _semanticSearch.default.processSearchLimit(_fixtures.search2Id, 2);
      expect(_api.default.processDocument).toHaveBeenCalledTimes(2);
      expect(_api.default.processDocument).toHaveBeenCalledWith({
        searchTerm: 'injustice',
        contents: { 1: 'text2' } });

      expect(_api.default.processDocument).toHaveBeenCalledWith({
        searchTerm: 'injustice',
        contents: { 1: 'text3' } });

      const theSearch = await _model.default.getById(_fixtures.search2Id);
      expect(theSearch.documents.some(
      doc => doc.sharedId === 'doc2' && doc.status === 'completed')).toBe(true);
      expect(theSearch.documents.some(
      doc => doc.sharedId === 'doc3' && doc.status === 'completed')).toBe(true);
      expect(theSearch.documents.some(
      doc => doc.sharedId === 'doc5' && doc.status === 'pending')).toBe(true);
      const res = await _resultsModel.default.get({ searchId: _fixtures.search2Id });
      expect(res.some(r => r.sharedId === 'doc2')).toBe(true);
      expect(res.some(r => r.sharedId === 'doc3')).toBe(true);

      expect(theSearch.status).toBe('inProgress');
    });
    it('should return the updated search and processed documents', async () => {
      const res = await _semanticSearch.default.processSearchLimit(_fixtures.search2Id, 2);
      expect(res.updatedSearch._id).toEqual(_fixtures.search2Id);
      delete res.updatedSearch._id;
      expect(res).toMatchSnapshot();
    });
    it('should mark search as complete if all documents are processed', async () => {
      await _semanticSearch.default.processSearchLimit(_fixtures.search2Id, 5);
      const theSearch = await _model.default.getById(_fixtures.search2Id);
      expect(theSearch.status).toBe('completed');
    });
  });

  describe('getAllSearches', () => {
    it('should return all searches', async () => {
      const searches = await _semanticSearch.default.getAllSearches();
      expect(searches[0]._id).toEqual(_fixtures.search1Id);
      expect(searches.length).toBe(4);
    });
  });

  describe('getPending', () => {
    it('should return pending searches', async () => {
      const pending = await _semanticSearch.default.getPending();
      expect(pending.length).toBe(1);
      expect(pending[0]._id).toEqual(_fixtures.search2Id);
    });
  });

  describe('getInProgress', () => {
    it('should return all searches in progress', async () => {
      const inProgress = await _semanticSearch.default.getInProgress();
      expect(inProgress.length).toBe(1);
      expect(inProgress[0]._id).toEqual(_fixtures.search1Id);
    });
  });

  describe('getAllDocumentResults', () => {
    it('should return all document results of the specified search', async () => {
      const results = await _semanticSearch.default.getAllDocumentResults(_fixtures.search3Id);
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
        threshold: 0.6 };

      const results = await _semanticSearch.default.getSearchResults(_fixtures.searchIdForFilters, args);
      expect(results.map(r => r.sharedId)).toEqual(['3', '2']);
      expect(results.map(r => {
        const withoutIds = _objectSpread({}, r);
        delete withoutIds._id;
        delete withoutIds.searchId;
        return withoutIds;
      })).toMatchSnapshot();
    });
  });

  describe('getSearch', () => {
    it('should fetch a search by id and its document entities with filtered semantic search results', async () => {
      const res = await _semanticSearch.default.getSearch(_fixtures.search3Id, { threshold: 0.5, minRelevantSentences: 1 });
      res.results.forEach(doc => {
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
        await _semanticSearch.default.getSearch(_testing_db.default.id(), {});
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual((0, _utils.createError)('Search not found', 404));
      }
    });
  });

  describe('listSearchResultsDocs', () => {
    it('should return the shared id and templates of all results that match the filters', async () => {
      const args = {
        minRelevantSentences: 2,
        threshold: 0.6 };

      const results = await _semanticSearch.default.listSearchResultsDocs(_fixtures.searchIdForFilters, args);
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
      await _semanticSearch.default.deleteSearch(_fixtures.search3Id);
      const searchInDb = await _model.default.getById(_fixtures.search3Id);
      expect(searchInDb).toBeNull();
      const searchResults = await _resultsModel.default.get({ searchId: _fixtures.search3Id });
      expect(searchResults.length).toBe(0);
    });
    it('should return 404 error if search does not exist', async () => {
      try {
        await _semanticSearch.default.deleteSearch(_testing_db.default.id());
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual((0, _utils.createError)('Search not found', 404));
      }
    });
  });

  describe('stopSearch', () => {
    const testErrorIfWrongStatus = async (searchId, status) => {
      try {
        await _semanticSearch.default.stopSearch(searchId);
        fail('should throw error');
      } catch (e) {
        const theSearch = await _model.default.getById(searchId);
        expect(theSearch.status).toBe(status);
        expect(e.code).toBe(400);
      }
    };
    it('should set status to stopped if search is pending', async () => {
      await _semanticSearch.default.stopSearch(_fixtures.search2Id);
      const updatedSearch = await _model.default.getById(_fixtures.search2Id);
      expect(updatedSearch.status).toBe('stopped');
    });
    it('should set status to stopped if search is in progress', async () => {
      await _semanticSearch.default.stopSearch(_fixtures.search1Id);
      const updatedSearch = await _model.default.getById(_fixtures.search1Id);
      expect(updatedSearch.status).toBe('stopped');
    });
    it('should return the updated search', async () => {
      const stoppedSearch = await _semanticSearch.default.stopSearch(_fixtures.search1Id);
      expect(stoppedSearch.status).toBe('stopped');
    });
    it('should throw error if search is completed', async () => {
      await testErrorIfWrongStatus(_fixtures.search3Id, 'completed');
    });
    it('should throw error if search is stopped', async () => {
      await _model.default.db.findOneAndUpdate({ _id: _fixtures.search3Id }, { $set: { status: 'stopped' } });
      await testErrorIfWrongStatus(_fixtures.search3Id, 'stopped');
    });
    it('should throw error if search does not exist', async () => {
      try {
        await _semanticSearch.default.stopSearch(_testing_db.default.id());
        fail('should throw error');
      } catch (e) {
        expect(e.code).toBe(400);
      }
    });
  });

  describe('resumeSearch', () => {
    beforeEach(() => {
      jest.spyOn(_workerManager.default, 'notifyNewSearch').mockImplementation(() => {});
    });
    const testErrorIfWrongStatus = async (searchId, status) => {
      await _model.default.db.updateOne({ _id: searchId }, { $set: { status } });
      try {
        await _semanticSearch.default.resumeSearch(searchId);
        fail('should throw error');
      } catch (e) {
        const theSearch = await _model.default.getById(searchId);
        expect(theSearch.status).toBe(status);
        expect(e.code).toBe(400);
      }
    };
    it('should set status to pending if search is stopped', async () => {
      await _model.default.db.updateOne({ _id: _fixtures.search1Id }, { $set: { status: 'stopped' } });
      await _semanticSearch.default.resumeSearch(_fixtures.search1Id);
      const resumedSearch = await _model.default.getById(_fixtures.search1Id);
      expect(resumedSearch.status).toBe('pending');
    });
    it('should notify workerManager', async () => {
      await _model.default.db.updateOne({ _id: _fixtures.search1Id }, { $set: { status: 'stopped' } });
      await _semanticSearch.default.resumeSearch(_fixtures.search1Id);
      expect(_workerManager.default.notifyNewSearch).toHaveBeenCalledWith(_fixtures.search1Id);
    });
    it('should return the updated search', async () => {
      await _model.default.db.updateOne({ _id: _fixtures.search1Id }, { $set: { status: 'stopped' } });
      const resumed = await _semanticSearch.default.resumeSearch(_fixtures.search1Id);
      expect(resumed.status).toBe('pending');
    });
    it('should throw error if search is not stopped', async () => {
      const statuses = ['completed', 'pending', 'inProgress'];
      const searchIds = [_fixtures.search1Id, _fixtures.search2Id, _fixtures.search3Id];
      await Promise.all(statuses.map((status, index) => testErrorIfWrongStatus(searchIds[index], status)));
    });
  });
});