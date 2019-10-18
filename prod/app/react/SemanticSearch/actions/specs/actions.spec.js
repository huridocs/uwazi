"use strict";var _immutable = _interopRequireDefault(require("immutable"));
var _BasicReducer = require("../../../BasicReducer");
var _RequestParams = require("../../../utils/RequestParams");

var _SemanticSearchAPI = _interopRequireDefault(require("../../SemanticSearchAPI"));
var actions = _interopRequireWildcard(require("../actions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

describe('Semantic Search actions', () => {
  let dispatch;
  beforeEach(() => {
    jest.spyOn(_SemanticSearchAPI.default, 'getAllSearches').mockResolvedValue([{ _id: 'search1' }, { _id: 'search2' }]);
    jest.spyOn(_SemanticSearchAPI.default, 'getSearch');
    dispatch = jest.fn();
  });
  afterEach(() => {
    _SemanticSearchAPI.default.getAllSearches.mockReset();
    _SemanticSearchAPI.default.getSearch.mockReset();
  });
  async function expectFetchSearchesToHaveBeenDispatched(dispatchMock) {
    const fetchSearchesAction = dispatch.mock.calls[0][0];
    await fetchSearchesAction(dispatchMock);
    expect(_SemanticSearchAPI.default.getAllSearches).toHaveBeenCalled();
  }

  describe('fetchSearches', () => {
    it('should fetch searches from api and dispatch response in store', async () => {
      const action = actions.fetchSearches();
      await action(dispatch);
      expect(_SemanticSearchAPI.default.getAllSearches).toHaveBeenCalled();
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
  });

  describe('selectSemanticSearchDocument', () => {
    it('should set selected semantic search document and select semantic search tab in sidepanel', () => {
      const doc = { sharedId: 'document' };
      const action = actions.selectSemanticSearchDocument(doc);
      action(dispatch);
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
  });

  describe('unselectSemanticSearchDocument', () => {
    it('should set the empty object as the selected semantic search document', () => {
      const action = actions.unselectSemanticSearchDocument();
      action(dispatch);
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
  });

  describe('submitNewSearch', () => {
    it('should start new search and fetch searches', async () => {
      jest.spyOn(_SemanticSearchAPI.default, 'search').mockResolvedValue({ searchTerm: 'search' });
      const args = { searchTerm: 'search', filters: { a: {}, b: { values: ['c'] } } };
      const action = actions.submitNewSearch(args);
      await action(dispatch);
      expect(_SemanticSearchAPI.default.search).toHaveBeenCalledWith(
      new _RequestParams.RequestParams({ searchTerm: 'search', query: { searchTerm: '', filters: { b: { values: ['c'] } } } }));

      expectFetchSearchesToHaveBeenDispatched(dispatch);
    });
  });

  describe('showSemanticSearch', () => {
    it('should show semantic search panel', () => {
      const action = actions.showSemanticSearch();
      action(dispatch);
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
  });

  describe('hideSemanticSearch', () => {
    it('should hide semantic search panel', () => {
      const action = actions.hideSemanticSearch();
      action(dispatch);
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
  });

  describe('deleteSearch', () => {
    it('should delete search and re-fetch searches', async () => {
      jest.spyOn(_SemanticSearchAPI.default, 'deleteSearch').mockResolvedValue({ deleted: true });
      const searchId = 'search';
      const action = actions.deleteSearch(searchId);
      await action(dispatch);
      expect(_SemanticSearchAPI.default.deleteSearch).toHaveBeenCalledWith(new _RequestParams.RequestParams({ searchId }));
      expectFetchSearchesToHaveBeenDispatched(dispatch);
    });
  });

  describe('stopSearch', () => {
    it('should stop search and re-fetch searches', async () => {
      jest.spyOn(_SemanticSearchAPI.default, 'stopSearch').mockResolvedValue({ status: 'stopped' });
      const searchId = 'search';
      const action = actions.stopSearch(searchId);
      await action(dispatch);
      expect(_SemanticSearchAPI.default.stopSearch).toHaveBeenCalledWith(new _RequestParams.RequestParams({ searchId }));
      expectFetchSearchesToHaveBeenDispatched(dispatch);
    });
  });

  describe('resumeSearch', () => {
    it('should resume search and re-fetch searches', async () => {
      jest.spyOn(_SemanticSearchAPI.default, 'resumeSearch').mockResolvedValue({ status: 'pending' });
      const searchId = 'search';
      const action = actions.resumeSearch(searchId);
      await action(dispatch);
      expect(_SemanticSearchAPI.default.resumeSearch).toHaveBeenCalledWith(new _RequestParams.RequestParams({ searchId }));
      expectFetchSearchesToHaveBeenDispatched(dispatch);
    });
  });

  describe('registerForUpdates', () => {
    it('should request update notifications from API', async () => {
      jest.spyOn(_SemanticSearchAPI.default, 'registerForUpdates').mockResolvedValue({ ok: true });
      const action = actions.registerForUpdates();
      await action();
      expect(_SemanticSearchAPI.default.registerForUpdates).toHaveBeenCalled();
    });
  });

  describe('updateSearch', () => {
    it('should update specified search in the searches store', async () => {
      const updatedSearch = { _id: 'search', status: 'completed' };
      const action = actions.updateSearch(updatedSearch);
      action(dispatch);
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
  });

  describe('addSearchResults', () => {
    let currentResults;
    beforeEach(() => {
      currentResults = [{ _id: 'search1' }, { _id: 'search2' }];
    });
    const getState = () => ({
      semanticSearch: {
        search: _immutable.default.fromJS({
          results: currentResults }) } });



    it('should add specified documents to current search results', () => {
      const newDocs = [{ _id: 'new1' }, { _id: 'new2' }];
      const action = actions.addSearchResults(newDocs);
      action(dispatch, getState);
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
    it('should not add duplicate documents in search results', () => {
      currentResults = [{ _id: 'search1' }, { _id: 'search2' }, { _id: 'new1' }];
      const newDocs = [{ _id: 'new1' }, { _id: 'new2' }];
      const action = actions.addSearchResults(newDocs);
      action(dispatch, getState);
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
  });

  describe('getSearch', () => {
    let state;
    let getState;
    let args;
    let search;
    beforeEach(() => {
      args = { threshold: 0.4 };
      search = { _id: 'searchId' };
      state = {
        semanticSearch: {
          selectedDocument: null } };


    });
    const makeMocks = () => {
      getState = jest.fn().mockReturnValue(state);
      jest.spyOn(_SemanticSearchAPI.default, 'getSearch').mockResolvedValue(search);
    };
    it('should fetch search and set current semantic search', async () => {
      makeMocks();
      const action = actions.getSearch('searchId', args);
      await action(dispatch, getState);
      expect(_SemanticSearchAPI.default.getSearch).toHaveBeenCalledWith(new _RequestParams.RequestParams(_objectSpread({ searchId: 'searchId' }, args)));
      expect(dispatch).toHaveBeenCalledWith(_BasicReducer.actions.set('semanticSearch/search', search));
    });
    it('should update selected document if its among search results', async () => {
      const updatedDoc = {
        sharedId: 'doc1',
        semanticSearch: {} };

      search = {
        _id: 'searchId',
        results: [
        updatedDoc,
        { sharedId: 'otherDoc' }] };


      state = {
        semanticSearch: {
          selectedDocument: _immutable.default.fromJS({
            sharedId: 'doc1' }) } };



      makeMocks();
      const action = actions.getSearch('searchId', args);
      await action(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith(_BasicReducer.actions.set('semanticSearch/selectedDocument', updatedDoc));
    });
  });

  describe('getMoreSearchResults', () => {
    it('should fetch search and add to current results', async () => {
      const results = [{ sharedId: 'doc1' }, { sharedId: 'doc2' }];
      const args = { skip: 60 };
      jest.spyOn(_SemanticSearchAPI.default, 'getSearch').mockResolvedValue({ searchId: 'searchId', results });
      const action = actions.getMoreSearchResults('searchId', args);

      await action(dispatch);
      expect(_SemanticSearchAPI.default.getSearch).toHaveBeenCalledWith(new _RequestParams.RequestParams(_objectSpread({ searchId: 'searchId' }, args)));
      expect(dispatch).toHaveBeenCalledWith(_BasicReducer.actions.concatIn('semanticSearch/search', ['results'], results));
    });
  });

  describe('editSearchEntities', () => {
    it('should fetch documents matching search filters and set them for multi edit', async () => {
      const args = { threshold: 0.4, minRelevantSentences: 5 };
      const results = [{ searchId: 'doc1', template: 'tpl1' }];
      jest.spyOn(_SemanticSearchAPI.default, 'getEntitiesMatchingFilters').mockResolvedValue(results);
      const action = actions.editSearchEntities('searchId', args);
      await action(dispatch);
      expect(_SemanticSearchAPI.default.getEntitiesMatchingFilters).toHaveBeenCalledWith(
      new _RequestParams.RequestParams(_objectSpread({ searchId: 'searchId' }, args)));

      const setEditFn = dispatch.mock.calls[dispatch.mock.calls.length - 1][0];
      setEditFn(dispatch);
      expect(dispatch).toHaveBeenCalledWith(_BasicReducer.actions.set('semanticSearch/multiedit', results));
    });
  });

  describe('setEditSearchEntities', () => {
    it('should set search entities for multi edit', () => {
      const entities = [{ searchId: 'doc1' }];
      const action = actions.setEditSearchEntities(entities);
      action(dispatch);
      expect(dispatch).toHaveBeenCalledWith(_BasicReducer.actions.set('semanticSearch/multiedit', entities));
    });
  });
});