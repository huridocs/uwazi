import reducer from '~/controllers/Templates/templatesReducer';
import * as types from '~/controllers/Templates/actionTypes';
import Immutable from 'immutable';
import 'jasmine-immutablejs-matchers';

describe('fieldsReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state []', () => {
      let newState = reducer();
      expect(newState).toEqual(Immutable.fromJS([]));
    });
  });

  describe('SET_TEMPLATES', () => {
    it('should set templates passed', () => {
      let templates = Immutable.fromJS([{name: 'new'}]);

      let newState = reducer(null, {type: types.SET_TEMPLATES, templates});

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(templates);
    });
  });
});
