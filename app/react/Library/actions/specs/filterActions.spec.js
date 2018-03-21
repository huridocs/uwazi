import {browserHistory} from 'react-router';
import {actions as formActions} from 'react-redux-form';
import Immutable from 'immutable';

import * as actions from 'app/Library/actions/filterActions';
import comonPropertiesHelper from 'shared/comonProperties';
import * as libraryActions from 'app/Library/actions/libraryActions';
import libraryHelper from 'app/Library/helpers/libraryFilters';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import * as types from 'app/Library/actions/actionTypes';

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
    libraryFilters = [{name: 'author', filter: true}, {name: 'country', filter: true}];
    search = {searchTerm: '', filters: {author: 'RR Martin', country: ''}};
    filtersState = {
      documentTypes,
      properties: libraryFilters,
      allDocumentTypes: false
    };

    store = {
      library: {
        filters: Immutable.fromJS(filtersState),
        search
      },
      templates: Immutable.fromJS(templates),
      thesauris: Immutable.fromJS(thesauris)
    };

    spyOn(comonPropertiesHelper, 'comonProperties').and.returnValue(libraryFilters);
    spyOn(libraryHelper, 'populateOptions').and.returnValue(libraryFilters);
    dispatch = jasmine.createSpy('dispatch');
    spyOn(formActions, 'reset').and.returnValue('FILTERS_RESET');
    spyOn(formActions, 'setInitial').and.returnValue('FILTERS_SET_INITIAL');
    getState = jasmine.createSpy('getState').and.returnValue(store);
  });

  describe('filterDocumentTypes', () => {
    beforeEach(() => {
      spyOn(prioritySortingCriteria, 'get').and.returnValue({sort: 'metadata.date', order: 'desc'});
    });

    it('should perform a search with the filters and prioritySortingCriteria', () => {
      store.library.search.sort = 'metadata.date';
      store.library.search.order = 'desc';
      store.library.selectedSorting = 'selectedSorting';
      store.templates = Immutable.fromJS([
        {_id: 'a', properties: [{filter: true, type: 'date', name: 'date'}]},
        {_id: 'b'}
      ]);

      spyOn(libraryActions, 'searchDocuments');
      actions.filterDocumentTypes(['a'], 'library')(dispatch, getState);

      expect(prioritySortingCriteria.get).toHaveBeenCalledWith({
        currentCriteria: {sort: 'metadata.date', order: 'desc'},
        filteredTemplates: ['a'],
        templates: store.templates,
        selectedSorting: 'selectedSorting'
      });

      const searchParam = libraryActions.searchDocuments.calls.argsFor(0)[0];

      expect(searchParam.search.sort).toBe('metadata.date');
      expect(searchParam.search.order).toBe('desc');
      expect(searchParam.filters).toEqual({documentTypes: ['a'], properties: libraryFilters});
    });
  });

  describe('resetFilters', () => {
    it('should deactivate all the properties and documentTypes', () => {
      spyOn(browserHistory, 'push');
      actions.resetFilters('library')(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith({
        type: types.SET_LIBRARY_FILTERS,
        libraryFilters: [],
        documentTypes: []
      });
    });

    it('should perform a search with the filters reset', () => {
      let searchDocumentsCallback = jasmine.createSpy('searchDocumentsCallback');
      const storeKey = 'library';
      spyOn(libraryActions, 'searchDocuments').and.returnValue(searchDocumentsCallback);
      actions.resetFilters(storeKey)(dispatch, getState);

      expect(libraryActions.searchDocuments).toHaveBeenCalledWith({search}, storeKey);
      expect(searchDocumentsCallback).toHaveBeenCalledWith(dispatch, getState);
    });
  });

  describe('toggleFilter', () => {
    describe('when a property is not active', () => {
      it('should activate it', () => {
        actions.toggleFilter('author', libraryFilters)(dispatch, getState);
        expect(dispatch).toHaveBeenCalledWith({
          type: types.UPDATE_LIBRARY_FILTERS,
          libraryFilters: [{name: 'author', filter: true, active: true},
          {name: 'country', filter: true}]
        });
      });
    });

    describe('when a property is active', () => {
      it('should deactivate it', () => {
        filtersState.properties[0].active = true;
        store.library.filters = Immutable.fromJS(filtersState);

        actions.toggleFilter('author', libraryFilters)(dispatch, getState);
        expect(dispatch).toHaveBeenCalledWith({
          type: types.UPDATE_LIBRARY_FILTERS,
          libraryFilters: [{name: 'author', filter: true, active: false},
          {name: 'country', filter: true}]
        });
      });
    });
  });
});
