import Immutable from 'immutable';

import reducer from '~/Templates/reducers/templatesReducer';
import * as types from '~/Templates/actions/actionTypes';
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

  describe('DELETE_TEMPLATE', () => {
    it('should delete template by id', () => {
      let state = Immutable.fromJS([{id: '1'}, {id: '2'}, {id: '3'}]);
      let templateId = '2';

      let newState = reducer(state, {type: types.DELETE_TEMPLATE, id: templateId});

      let expected = Immutable.fromJS([{id: '1'}, {id: '3'}]);
      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
});
