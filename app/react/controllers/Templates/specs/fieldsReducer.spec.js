import fieldsReducer from '../fieldsReducer';
import Immutable from 'immutable';
import 'jasmine-immutablejs-matchers';

describe('fieldsReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state []', () => {
      let newState = fieldsReducer();

      expect(newState).toEqual(Immutable.fromJS([]));
    });
  });

  describe('ADD_FIELD', () => {
    it('should add a new field', () => {
      let state = Immutable.fromJS([]);

      let newState = fieldsReducer(state, {type: 'ADD_FIELD', fieldType: 'fieldType', label: 'myLabel'});
      let expected = Immutable.fromJS([{fieldType: 'fieldType', label: 'myLabel'}]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('DELETE_FIELD', () => {
    it('should delete the specified field', () => {
      let state = Immutable.fromJS([{fieldType: 'input', name: 'email'}, {fieldType: 'input', name: 'password'}]);

      let newState = fieldsReducer(state, {type: 'DELETE_FIELD', index: 0});
      let expected = Immutable.fromJS([{fieldType: 'input', name: 'password'}]);

      expect(newState).toEqualImmutable(expected);
    });
  });
});
