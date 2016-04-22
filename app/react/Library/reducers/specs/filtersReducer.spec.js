import Immutable from 'immutable';
import * as types from 'app/Library/actions/actionTypes';

import filtersReducer from 'app/Library/reducers/filtersReducer';
import 'jasmine-immutablejs-matchers';

describe('filtersReducer', () => {
  const initialState = Immutable.fromJS({templates: [], docTypes: []});

  describe('when state is undefined', () => {
    it('returns initial', () => {
      let newState = filtersReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('SET_TEMPLATES', () => {
    it('should set the templates in the state', () => {
      let templates = [{name: 'Decision', _id: 'cba2'}, {name: 'Ruling', _id: 'abc1'}];
      let newState = filtersReducer(initialState, {type: types.SET_TEMPLATES, templates});
      expect(newState.toJS().templates).toEqual(templates);
    });
  });
});
