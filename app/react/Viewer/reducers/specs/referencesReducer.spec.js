import Immutable from 'immutable';
import 'jasmine-immutablejs-matchers';

import referencesReducer from 'app/Viewer/reducers/referencesReducer';
import * as types from 'app/Viewer/actions/actionTypes';

describe('documentReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state', () => {
      let newState = referencesReducer();

      expect(newState).toBeImmutable();
      expect(newState.toJS()).toEqual([]);
    });
  });

  describe('SET_REFERENCES', () => {
    it('should set document passed', () => {
      let newState = referencesReducer(null, {type: types.SET_REFERENCES, references: [{title: 'test'}]});
      let expected = Immutable.fromJS([{title: 'test'}]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
  describe('ADD_CREATED_REFERENCE', () => {
    it('should should add reference passed', () => {
      let newState = referencesReducer(Immutable.fromJS([1]), {type: types.ADD_CREATED_REFERENCE, reference: 2});
      let expected = Immutable.fromJS([1, 2]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
  describe('RESET_DOCUMENT_VIEWER', () => {
    it('should reset to initialState', () => {
      let newState = referencesReducer(['reference'], {type: types.RESET_DOCUMENT_VIEWER});
      let expected = Immutable.fromJS([]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
});
