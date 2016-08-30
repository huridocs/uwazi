import Immutable from 'immutable';
import * as types from 'app/Library/actions/actionTypes';

import filtersReducer from 'app/Library/reducers/filtersReducer';
import 'jasmine-immutablejs-matchers';

describe('filtersReducer', () => {
  const initialState = Immutable.fromJS({templates: [], properties: [], thesauris: [], allDocumentTypes: false, documentTypes: []});

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

  describe('SET_LIBRARY_TEMPLATES', () => {
    it('should set the templates in the state', () => {
      let newState = filtersReducer(initialState, {type: types.SET_LIBRARY_TEMPLATES, templates, thesauris, libraryFilters});
      expect(newState.toJS().templates).toEqual(templates);
    });

    it('should set the thesauris in the state', () => {
      let newState = filtersReducer(initialState, {type: types.SET_LIBRARY_TEMPLATES, templates, thesauris, libraryFilters});
      expect(newState.toJS().thesauris).toEqual(thesauris);
    });

    it('should set an object with the properties to be used as filters', () => {
      let newState = filtersReducer(initialState, {type: types.SET_LIBRARY_TEMPLATES, templates, thesauris, libraryFilters});
      expect(newState.get('properties').toJS()).toEqual(libraryFilters);
    });
  });

  describe('SET_LIBRARY_FILTERS', () => {
    it('should set the properties', () => {
      const state = Immutable.fromJS({properties: []});

      let newState = filtersReducer(state, {type: types.SET_LIBRARY_FILTERS, libraryFilters});
      expect(newState.get('properties').toJS()).toEqual(libraryFilters);
    });
  });
});
