import Immutable from 'immutable';
import * as types from 'app/Library/actions/actionTypes';

import filtersReducer from 'app/Library/reducers/filtersReducer';
import 'jasmine-immutablejs-matchers';

describe('filtersReducer', () => {
  const initialState = Immutable.fromJS({templates: [], properties: [], allDocumentTypes: false});

  describe('when state is undefined', () => {
    it('returns initial', () => {
      let newState = filtersReducer();
      expect(newState).toEqual(initialState);
    });
  });

  let templates = [
    {_id: 'cba2', properties: [
      {name: 'author', filter: false, type: 'text'},
      {name: 'country', filter: true, type: 'select', content: 'abc1'}
    ]},
    {_id: 'abc1', properties: [
      {name: 'author', filter: false, type: 'text'},
      {name: 'country', filter: true, type: 'select', content: 'abc1'}
    ]}
  ];

  let thesauris = [{_id: 'abc1', values: ['thesauri values']}];

  let libraryFilters = [{name: 'country', filter: true, type: 'select', content: 'abc1', options: ['thesauri values']}];

  let documentTypes = {cba1: false, abc1: false};

  describe('SET_TEMPLATES', () => {
    it('should set the templates in the state', () => {
      let newState = filtersReducer(initialState, {type: types.SET_TEMPLATES, templates, thesauris, libraryFilters, documentTypes});
      expect(newState.toJS().templates).toEqual(templates);
    });

    it('should set the thesauris in the state', () => {
      let newState = filtersReducer(initialState, {type: types.SET_TEMPLATES, templates, thesauris, libraryFilters, documentTypes});
      expect(newState.toJS().thesauris).toEqual(thesauris);
    });

    it('should set an object with each templateid to be used as doctype filter flags', () => {
      let newState = filtersReducer(initialState, {type: types.SET_TEMPLATES, templates, thesauris, libraryFilters, documentTypes});
      expect(newState.toJS().documentTypes).toEqual(documentTypes);
      expect(newState.toJS().allDocumentTypes).toBe(false);
    });

    it('should set an object with the properties to be used as filters', () => {
      let newState = filtersReducer(initialState, {type: types.SET_TEMPLATES, templates, thesauris, libraryFilters, documentTypes});
      expect(newState.get('properties').toJS()).toEqual(libraryFilters);
    });
  });

  describe('SET_LIBRARY_FILTERS', () => {
    it('should set the documentTypes and the properties', () => {
      const state = Immutable.fromJS({documentTypes: {}, libraryFilters: []});

      let newState = filtersReducer(state, {type: types.SET_LIBRARY_FILTERS, documentTypes, libraryFilters});
      expect(newState.get('documentTypes').toJS()).toEqual(documentTypes);
      expect(newState.get('properties').toJS()).toEqual(libraryFilters);
    });

    it('should change "allDocumentTypes" to true if all are true', () => {
      const state = Immutable.fromJS({documentTypes: {a: true, b: true, c: false}, templates: [], thesauris: []});
      let newState = filtersReducer(state, {type: types.SET_LIBRARY_FILTERS, documentTypes: {a: true, b: true, c: true}, libraryFilters});
      expect(newState.toJS().allDocumentTypes).toBe(true);
    });

    it('should change "allDocumentTypes" to false if any are false', () => {
      const state = Immutable.fromJS({documentTypes: {a: true, b: true, c: true}, templates: [], thesauris: []});

      let newState = filtersReducer(state, {type: types.SET_LIBRARY_FILTERS, documentTypes: {a: true, b: true, c: false}, libraryFilters});
      expect(newState.toJS().allDocumentTypes).toBe(false);
    });
  });
});
