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

      let newState = fieldsReducer(state, {type: 'ADD_FIELD', fieldType: 'fieldType'});
      let expected = Immutable.fromJS([{fieldType: 'fieldType'}]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
});
