import fieldsReducer from '../fieldsReducer';
import Immutable from 'immutable';
import * as types from '../actionTypes';
import 'jasmine-immutablejs-matchers';

describe('fieldsReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state []', () => {
      let newState = fieldsReducer();

      expect(newState).toEqual(Immutable.fromJS([]));
    });
  });

  describe('ADD_FIELD', () => {
    it('should add a new field with the config passed', () => {
      let state = Immutable.fromJS([]);

      let newState = fieldsReducer(state, {type: types.ADD_FIELD, config: {test: 'test'}});
      let expected = Immutable.fromJS([{test: 'test'}]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('DELETE_FIELD', () => {
    it('should delete the specified field', () => {
      let state = Immutable.fromJS([{fieldType: 'input', name: 'email'}, {fieldType: 'input', name: 'password'}]);

      let newState = fieldsReducer(state, {type: types.REMOVE_FIELD, index: 0});
      let expected = Immutable.fromJS([{fieldType: 'input', name: 'password'}]);

      expect(newState).toEqualImmutable(expected);
    });
  });
});
