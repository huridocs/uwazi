import * as actions from 'app/Library/actions/filterActions';
import * as types from 'app/Library/actions/actionTypes';
import * as libraryActions from 'app/Library/actions/libraryActions';
import {actions as formActions} from 'react-redux-form';
import Immutable from 'immutable';

import libraryHelper from 'app/Library/helpers/libraryFilters';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

describe('filterActions', () => {
  let templates = ['templates'];
  let thesauris = ['thesauris'];
  let documentTypes = ['a', 'b'];
  let libraryFilters;
  let dispatch;
  let getState;
  let store;
  let search;
  let filtersState;

  beforeEach(() => {
    libraryFilters = [{name: 'author'}, {name: 'country'}];
    search = {searchTerm: '', filters: {author: 'RR Martin', country: ''}};
    filtersState = {
      documentTypes,
      properties: libraryFilters,
      allDocumentTypes: false
    };

    store = {
      library: {filters: Immutable.fromJS(filtersState)},
      search,
      templates: Immutable.fromJS(templates),
      thesauris: Immutable.fromJS(thesauris)
    };

    spyOn(libraryHelper, 'libraryFilters').and.returnValue(libraryFilters);
    spyOn(libraryHelper, 'populateOptions').and.returnValue(libraryFilters);
    dispatch = jasmine.createSpy('dispatch');
    spyOn(formActions, 'change').and.returnValue('FILTERS_UPDATED');
    getState = jasmine.createSpy('getState').and.returnValue(store);
  });

  describe('filterDocumentTypes', () => {
    beforeEach(() => {
      spyOn(prioritySortingCriteria, 'get').and.returnValue({sort: 'metadata.date', order: 'desc'});
    });

    it('should dispatch an action SET_LIBRARY_FILTERS with the given types', () => {
      actions.filterDocumentTypes(['a'])(dispatch, getState);
      expect(libraryHelper.libraryFilters).toHaveBeenCalledWith(templates, ['a']);
      expect(libraryHelper.populateOptions).toHaveBeenCalledWith(libraryFilters, thesauris);
      expect(dispatch).toHaveBeenCalledWith({type: types.SET_LIBRARY_FILTERS, libraryFilters, documentTypes: ['a']});
    });

    it('should call form actions change with the new filters', () => {
      actions.filterDocumentTypes(['a'])(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('search.filters', {author: 'RR Martin', country: ''});
      expect(dispatch).toHaveBeenCalledWith('FILTERS_UPDATED');
    });

    it('should perform a search with the filters and prioritySortingCriteria', () => {
      store.search.sort = 'metadata.date';
      store.search.order = 'desc';
      store.templates = Immutable.fromJS([
        {_id: 'a', properties: [{filter: true, type: 'date', name: 'date'}]},
        {_id: 'b'}
      ]);

      spyOn(libraryActions, 'searchDocuments');
      actions.filterDocumentTypes(['a'])(dispatch, getState);

      expect(prioritySortingCriteria.get).toHaveBeenCalledWith({
        currentCriteria: {sort: 'metadata.date', order: 'desc'},
        filteredTemplates: ['a'],
        templates: store.templates
      });

      expect(libraryActions.searchDocuments.calls.argsFor(0)[0].sort).toBe('metadata.date');
      expect(libraryActions.searchDocuments.calls.argsFor(0)[0].order).toBe('desc');
    });
  });

  describe('resetFilters', () => {
    it('should set all filters to an empty string', () => {
      actions.resetFilters()(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('search.filters', {});
      expect(dispatch).toHaveBeenCalledWith('FILTERS_UPDATED');
    });

    it('should deactivate all the properties and documentTypes', () => {
      actions.resetFilters()(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith({
        type: types.SET_LIBRARY_FILTERS,
        libraryFilters: [],
        documentTypes: []
      });
    });

    it('should perform a search with the filters reset', () => {
      let searchDocumentsCallback = jasmine.createSpy('searchDocumentsCallback');
      spyOn(libraryActions, 'searchDocuments').and.returnValue(searchDocumentsCallback);
      actions.resetFilters()(dispatch, getState);

      expect(libraryActions.searchDocuments).toHaveBeenCalledWith(search);
      expect(searchDocumentsCallback).toHaveBeenCalledWith(dispatch, getState);
    });
  });

  describe('toggleFilter', () => {
    describe('when a property is not active', () => {
      it('should activate it', () => {
        actions.toggleFilter('author')(dispatch, getState);
        expect(dispatch).toHaveBeenCalledWith({
          type: types.UPDATE_LIBRARY_FILTERS,
          libraryFilters: [{name: 'author', active: true},
          {name: 'country'}]
        });
      });
    });

    describe('when a property is active', () => {
      it('should deactivate it', () => {
        filtersState.properties[0].active = true;
        store.library.filters = Immutable.fromJS(filtersState);

        actions.toggleFilter('author')(dispatch, getState);
        expect(dispatch).toHaveBeenCalledWith({
          type: types.UPDATE_LIBRARY_FILTERS,
          libraryFilters: [{name: 'author', active: false},
          {name: 'country'}]
        });
      });
    });
  });

  describe('activateFilter', () => {
    it('should activate the filter', () => {
      actions.activateFilter('author', true)(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith({
        type: types.UPDATE_LIBRARY_FILTERS,
        libraryFilters: [{name: 'author', active: true},
        {name: 'country'}]
      });
    });
  });
});
