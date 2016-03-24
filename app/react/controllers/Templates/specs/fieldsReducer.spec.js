import fieldsReducer from '../fieldsReducer';
import Immutable from 'immutable';

let reduce = (state, action) => {
  return fieldsReducer(Immutable.fromJS(state), action);
};

describe('fieldsReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state []', () => {
      let newState = fieldsReducer();

      expect(newState).toEqual([]);
    });
  });

  describe('ADD_FIELD', () => {
    it('should add a new field', () => {
      let state = [];

      let newState = reduce(state, {type: 'ADD_FIELD'});

      expect(Immutable.is(newState, Immutable.fromJS([{type: 'input'}]))).toBe(true);
    });
  });
});
