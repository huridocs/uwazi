import Immutable from 'immutable';
import * as types from 'app/Library/actions/actionTypes';

import filtersReducer from 'app/Library/reducers/filtersReducer';

describe('filtersReducer', () => {
  const initialState = Immutable.fromJS({ properties: [], documentTypes: [] });

  describe('when state is undefined', () => {
    it('returns initial', () => {
      const newState = filtersReducer();
      expect(newState).toEqual(initialState);
    });
  });

  const libraryFilters = [
    {
      name: 'country',
      filter: true,
      type: 'select',
      content: 'abc1',
      options: ['thesauri values'],
    },
  ];

  describe('SET_LIBRARY_FILTERS', () => {
    it('should set the properties', () => {
      const state = Immutable.fromJS({ properties: [] });

      const newState = filtersReducer(state, { type: types.SET_LIBRARY_FILTERS, libraryFilters });
      expect(newState.get('properties').toJS()).toEqual(libraryFilters);
    });
  });

  describe('INITIALIZE_FILTERS_FORM', () => {
    it('should set the properties', () => {
      const state = Immutable.fromJS({ properties: [] });

      const newState = filtersReducer(state, {
        type: types.INITIALIZE_FILTERS_FORM,
        libraryFilters,
      });
      expect(newState.get('properties').toJS()).toEqual(libraryFilters);
    });
  });
});
