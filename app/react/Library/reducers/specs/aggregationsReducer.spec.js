import Immutable from 'immutable';
import * as actions from 'app/Library/actions/libraryActions';

import aggregationsReducer from 'app/Library/reducers/aggregationsReducer';
import 'jasmine-immutablejs-matchers';

describe('aggregationsReducer', () => {
  const initialState = Immutable.fromJS({});

  describe('when state is undefined', () => {
    it('returns initial', () => {
      let newState = aggregationsReducer();
      expect(newState).toEqual(initialState);
    });
  });

  let libraryFilters = [{name: 'country', filter: true, type: 'select', content: 'abc1', options: ['thesauri values']}];

  describe('initializeFiltersForm()', () => {
    it('should set the properties', () => {
      const state = Immutable.fromJS({});

      let newState = aggregationsReducer(state, actions.initializeFiltersForm({aggregations: 'aggregations'}));
      expect(newState).toBe('aggregations');
    });
  });
});
