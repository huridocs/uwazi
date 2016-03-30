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

  describe('ADD_PROPERTY', () => {
    it('should add a new field with the config passed on the index passed', () => {
      let state = Immutable.fromJS([{name: '1'}, {name: '2'}]);

      let newState = fieldsReducer(state, {type: types.ADD_PROPERTY, config: {name: 'test'}, index: 1});
      let expected = Immutable.fromJS([{name: '1'}, {name: 'test'}, {name: '2'}]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('UPDATE_PROPERTY', () => {
    it('should update the property in the correct index with the given config', () => {
      let state = Immutable.fromJS([{name: '1'}, {name: '2'}]);

      let newState = fieldsReducer(state, {type: types.UPDATE_PROPERTY, config: {newProp: 'newProp'}, index: 1});
      let expected = Immutable.fromJS([{name: '1'}, {name: '2', newProp: 'newProp'}]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('REMOVE_PROPERTY', () => {
    it('should delete the specified field', () => {
      let state = Immutable.fromJS([{fieldType: 'input', name: 'email'}, {fieldType: 'input', name: 'password'}]);

      let newState = fieldsReducer(state, {type: types.REMOVE_PROPERTY, index: 0});
      let expected = Immutable.fromJS([{fieldType: 'input', name: 'password'}]);

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('REORDER_PROPERTY', () => {
    it('should reorder the property based on the origin/target index', () => {
      let state = Immutable.fromJS([{name: '1'}, {name: '2'}, {name: '3'}]);

      let newState = fieldsReducer(state, {type: types.REORDER_PROPERTY, originIndex: 2, targetIndex: 0});
      let expected = Immutable.fromJS([{name: '3'}, {name: '1'}, {name: '2'}]);

      expect(newState).toEqualImmutable(expected);
    });
  });
});
