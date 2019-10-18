"use strict";var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _search = require("../../search");
var helpers = _interopRequireWildcard(require("../helpers"));
var _model = _interopRequireDefault(require("../model"));
var _resultsModel = _interopRequireDefault(require("../resultsModel"));
var _fixtures = _interopRequireWildcard(require("./fixtures"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

describe('semanticSearch helpers', () => {
  beforeEach(done => {
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done);
  });
  afterAll(done => {
    _testing_db.default.disconnect().then(done);
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
          filters: {} } };


      jest.spyOn(_search.search, 'search').mockResolvedValue({ rows: [] });
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
        expect(_search.search.search).toHaveBeenCalledWith(_objectSpread({},
        args.query, { limit: 9999, searchTerm: '' }),
        language,
        user);

      });

      it('should return documents from search results', async () => {
        jest.spyOn(_search.search, 'search').mockResolvedValue({
          rows: [
          { sharedId: 'doc1', file: {} },
          { sharedId: 'doc2' },
          { sharedId: 'doc3', file: {} }] });


        const res = await getSearchDocs();
        expect(res).toEqual(['doc1', 'doc2', 'doc3']);
      });
    });
  });

  describe('updateSearchDocumentResults', () => {
    it('should update the status of the specified document in the semantic search', async () => {
      await helpers.updateSearchDocumentStatus(_fixtures.search2Id, 'doc2', 'completed');
      const res = await _model.default.db.findOne({ _id: _fixtures.search2Id });
      expect(res.documents.find(doc => doc.sharedId === 'doc2').status).toBe('completed');
    });
  });

  describe('searchSearchDocumentResults', () => {
    const areResultsEqual = (a, b) => a.text === b.text && a.page === b.page && a.score === b.score;

    it('should set the results of the specified document sorted by higher score', async () => {
      const results = [{ page: '10', text: 't1', score: 0.2 }, { page: '20', text: 't2', score: 0.6 }];
      const searchId = _testing_db.default.id();
      await helpers.setSearchDocumentResults(searchId, 'doc1', results);
      const res = await _resultsModel.default.db.findOne({ searchId, sharedId: 'doc1' });
      expect(areResultsEqual(res.results[0], results[1])).toBe(true);
      expect(areResultsEqual(res.results[1], results[0])).toBe(true);
      expect(res.averageScore).toBe(0.4);
      expect(res.status).toBe('completed');
    });
  });

  describe('extractDocumentContent', () => {
    let doc;
    beforeEach(() => {
      doc = {
        template: _fixtures.template1Id,
        fullText: { 1: 'page 1', 2: 'page 2' },
        metadata: {
          code: 'code',
          description: 'a description',
          bio: 'a bio' } };


    });
    it('should return content from fullText and rich text fields grouped by page or field name', async () => {
      const contents = await helpers.extractDocumentContent(doc);
      expect(contents).toEqual({
        1: 'page 1',
        2: 'page 2',
        description: 'a description',
        bio: 'a bio' });

    });

    it('should strip page annotations from fullText content', async () => {
      doc.fullText = { 1: '[[1]]page [[1]]1', 2: 'page[[2]] 2' };
      const contents = await helpers.extractDocumentContent(doc);
      expect(contents['1']).toEqual('page 1');
      expect(contents['2']).toEqual('page 2');
    });

    it('should return metadata results when there is no full text', async () => {
      delete doc.fullText;
      const contents = await helpers.extractDocumentContent(doc);
      expect(contents).toEqual({
        description: 'a description',
        bio: 'a bio' });

    });

    it('should return full text results when there is no metadata', async () => {
      delete doc.metadata;
      let contents = await helpers.extractDocumentContent(doc);
      expect(contents).toEqual({
        1: 'page 1',
        2: 'page 2' });


      doc.metadata = { code: 'code' };
      contents = await helpers.extractDocumentContent(doc);
      expect(contents).toEqual({
        1: 'page 1',
        2: 'page 2' });

    });

    it('should return empty object if there is no full text or rich text fields', async () => {
      delete doc.fullText;
      delete doc.metadata;

      const contents = await helpers.extractDocumentContent(doc);
      expect(contents).toEqual({});
    });
  });
});