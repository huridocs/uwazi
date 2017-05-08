import Immutable from 'immutable';
import * as types from 'app/Library/actions/actionTypes';

import filtersReducer from 'app/Library/reducers/filtersReducer';
import 'jasmine-immutablejs-matchers';

describe('filtersReducer', () => {
  const initialState = Immutable.fromJS({properties: [], documentTypes: []});

  describe('when state is undefined', () => {
    it('returns initial', () => {
      let newState = filtersReducer();
      expect(newState).toEqual(initialState);
    });
  });

  let libraryFilters = [{name: 'country', filter: true, type: 'select', content: 'abc1', options: ['thesauri values']}];

  describe('SET_LIBRARY_FILTERS', () => {
    it('should set the properties', () => {
      const state = Immutable.fromJS({properties: []});

      let newState = filtersReducer(state, {type: types.SET_LIBRARY_FILTERS, libraryFilters});
      expect(newState.get('properties').toJS()).toEqual(libraryFilters);
    });
  });
});
