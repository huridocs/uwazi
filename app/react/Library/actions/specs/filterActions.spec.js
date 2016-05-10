import * as actions from 'app/Library/actions/filterActions';
import * as types from 'app/Library/actions/actionTypes';
import {actions as formActions} from 'react-redux-form';
import Immutable from 'immutable';

import libraryHelper from 'app/Library/helpers/libraryFilters';

describe('filterActions', () => {
  let templates = ['templates'];
  let thesauris = ['thesauris'];
  let documentTypes = {a: true, b: false};
  let libraryFilters = [{name: 'author'}, {name: 'country'}];
  let dispatch;
  let getState;

  beforeEach(() => {
    let state = {
      documentTypes,
      templates,
      thesauris,
      properties: libraryFilters,
      allDocumentTypes: false
    };

    let store = {
      library: {
        filters: Immutable.fromJS(state)
      },
      search: {searchTerm: '', filters: {author: 'RR Martin', country: ''}}
    };
    spyOn(libraryHelper, 'libraryFilters').and.returnValue(libraryFilters);
    dispatch = jasmine.createSpy('dispatch');
    spyOn(formActions, 'change').and.returnValue('FILTERS_UPDATED');
    getState = jasmine.createSpy('dispatch').and.returnValue(store);
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
});
