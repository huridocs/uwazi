"use strict";var _reactRouter = require("react-router");
var _reactReduxForm = require("react-redux-form");
var _immutable = _interopRequireDefault(require("immutable"));

var actions = _interopRequireWildcard(require("../filterActions"));
var _comonProperties = _interopRequireDefault(require("../../../../shared/comonProperties"));
var libraryActions = _interopRequireWildcard(require("../libraryActions"));
var _libraryFilters = _interopRequireDefault(require("../../helpers/libraryFilters"));
var _prioritySortingCriteria = _interopRequireDefault(require("../../../utils/prioritySortingCriteria"));
var types = _interopRequireWildcard(require("../actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('filterActions', () => {
  const templates = ['templates'];
  const thesauris = ['thesauris'];
  const documentTypes = ['a', 'b'];
  let libraryFilters;
  let dispatch;
  let getState;
  let store;
  let search;
  let filtersState;

  beforeEach(() => {
    libraryFilters = [{ name: 'author', filter: true }, { name: 'country', filter: true }];
    search = { searchTerm: '', filters: { author: 'RR Martin', country: '' } };
    filtersState = {
      documentTypes,
      properties: libraryFilters,
      allDocumentTypes: false };


    store = {
      library: {
        filters: _immutable.default.fromJS(filtersState),
        search },

      templates: _immutable.default.fromJS(templates),
      thesauris: _immutable.default.fromJS(thesauris) };


    spyOn(_comonProperties.default, 'comonProperties').and.returnValue(libraryFilters);
    spyOn(_libraryFilters.default, 'populateOptions').and.returnValue(libraryFilters);
    dispatch = jasmine.createSpy('dispatch');
    spyOn(_reactReduxForm.actions, 'reset').and.returnValue('FILTERS_RESET');
    spyOn(_reactReduxForm.actions, 'setInitial').and.returnValue('FILTERS_SET_INITIAL');
    getState = jasmine.createSpy('getState').and.returnValue(store);
  });

  describe('filterDocumentTypes', () => {
    beforeEach(() => {
      spyOn(_prioritySortingCriteria.default, 'get').and.returnValue({ sort: 'metadata.date', order: 'desc' });
    });

    it('should perform a search with the filters and prioritySortingCriteria', () => {
      store.library.search.sort = 'metadata.date';
      store.library.search.order = 'desc';
      store.library.selectedSorting = 'selectedSorting';
      store.templates = _immutable.default.fromJS([
      { _id: 'a', properties: [{ filter: true, type: 'date', name: 'date' }] },
      { _id: 'b' }]);


      spyOn(libraryActions, 'searchDocuments');
      actions.filterDocumentTypes(['a'], 'library')(dispatch, getState);

      expect(_prioritySortingCriteria.default.get).toHaveBeenCalledWith({
        currentCriteria: { sort: 'metadata.date', order: 'desc' },
        filteredTemplates: ['a'],
        templates: store.templates,
        selectedSorting: 'selectedSorting' });


      const searchParam = libraryActions.searchDocuments.calls.argsFor(0)[0];

      expect(searchParam.search.sort).toBe('metadata.date');
      expect(searchParam.search.order).toBe('desc');
      expect(searchParam.filters).toEqual({ documentTypes: ['a'], properties: libraryFilters });
    });
  });

  describe('resetFilters', () => {
    it('should deactivate all the properties, documentTypes and searchTerm', () => {
      spyOn(_reactRouter.browserHistory, 'push');
      actions.resetFilters('library')(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith({
        type: types.SET_LIBRARY_FILTERS,
        libraryFilters: [],
        documentTypes: [] });

      expect(dispatch).toHaveBeenCalledWith(_reactReduxForm.actions.load('library.search', {
        searchTerm: '',
        filters: {},
        order: 'desc',
        sort: 'creationDate' }));

    });

    it('should perform a search with the filters reset', () => {
      const searchDocumentsCallback = jasmine.createSpy('searchDocumentsCallback');
      const storeKey = 'library';
      spyOn(libraryActions, 'searchDocuments').and.returnValue(searchDocumentsCallback);
      actions.resetFilters(storeKey)(dispatch, getState);

      expect(libraryActions.searchDocuments).toHaveBeenCalledWith({ search }, storeKey);
      expect(searchDocumentsCallback).toHaveBeenCalledWith(dispatch, getState);
    });
  });

  describe('toggleFilter', () => {
    describe('when a property is not active', () => {
      it('should activate it', () => {
        actions.toggleFilter('author', libraryFilters)(dispatch, getState);
        expect(dispatch).toHaveBeenCalledWith({
          type: types.UPDATE_LIBRARY_FILTERS,
          libraryFilters: [{ name: 'author', filter: true, active: true },
          { name: 'country', filter: true }] });

      });
    });

    describe('when a property is active', () => {
      it('should deactivate it', () => {
        filtersState.properties[0].active = true;
        store.library.filters = _immutable.default.fromJS(filtersState);

        actions.toggleFilter('author', libraryFilters)(dispatch, getState);
        expect(dispatch).toHaveBeenCalledWith({
          type: types.UPDATE_LIBRARY_FILTERS,
          libraryFilters: [{ name: 'author', filter: true, active: false },
          { name: 'country', filter: true }] });

      });
    });
  });
});