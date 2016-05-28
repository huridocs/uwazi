import * as actions from 'app/Library/actions/filterActions';
import * as types from 'app/Library/actions/actionTypes';
import * as libraryActions from 'app/Library/actions/libraryActions';
import {actions as formActions} from 'react-redux-form';
import Immutable from 'immutable';

import libraryHelper from 'app/Library/helpers/libraryFilters';

describe('filterActions', () => {
  let templates = ['templates'];
  let thesauris = ['thesauris'];
  let documentTypes = {a: true, b: false};
  let libraryFilters;
  let dispatch;
  let getState;
  let store;
  let search;
  let state;

  beforeEach(() => {
    libraryFilters = [{name: 'author'}, {name: 'country'}];
    search = {searchTerm: '', filters: {author: 'RR Martin', country: ''}};
    state = {
      documentTypes,
      templates,
      thesauris,
      properties: libraryFilters,
      allDocumentTypes: false
    };

    store = {library: {filters: Immutable.fromJS(state)}, search};

    spyOn(libraryHelper, 'libraryFilters').and.returnValue(libraryFilters);
    dispatch = jasmine.createSpy('dispatch');
    spyOn(formActions, 'change').and.returnValue('FILTERS_UPDATED');
    getState = jasmine.createSpy('getState').and.returnValue(store);
  });

  describe('filterDocumentType', () => {
    it('should dispatch an action SET_LIBRARY_FILTERS with the given type', () => {
      actions.filterDocumentType('a')(dispatch, getState);
      expect(libraryHelper.libraryFilters).toHaveBeenCalledWith(templates, {a: false, b: false}, thesauris);
      expect(dispatch).toHaveBeenCalledWith({type: types.SET_LIBRARY_FILTERS, libraryFilters, documentTypes: {a: false, b: false}});
    });

    it('should call form actions change with the new filters', () => {
      actions.filterDocumentType('a')(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('search.filters', {author: 'RR Martin', country: ''});
      expect(dispatch).toHaveBeenCalledWith('FILTERS_UPDATED');
    });
  });

  describe('filterAllDocumentTypes', () => {
    it('should dispatch an action SET_LIBRARY_FILTERS with the given value', () => {
      actions.filterAllDocumentTypes(true)(dispatch, getState);
      expect(libraryHelper.libraryFilters).toHaveBeenCalledWith(templates, {a: true, b: true}, thesauris);
      expect(dispatch).toHaveBeenCalledWith({type: types.SET_LIBRARY_FILTERS, libraryFilters, documentTypes: {a: true, b: true}});
    });

    it('should call form actions change with the new filters', () => {
      actions.filterAllDocumentTypes(true)(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('search.filters', {author: 'RR Martin', country: ''});
      expect(dispatch).toHaveBeenCalledWith('FILTERS_UPDATED');
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
        documentTypes: {a: false, b: false}
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
        state.properties[0].active = true;
        store.library.filters = Immutable.fromJS(state);

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
      actions.activateFilter('author')(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith({
        type: types.UPDATE_LIBRARY_FILTERS,
        libraryFilters: [{name: 'author', active: true},
        {name: 'country'}]
      });
    });
  });
});
