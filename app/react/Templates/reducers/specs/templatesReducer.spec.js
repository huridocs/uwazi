import Immutable from 'immutable';

import reducer from 'app/Templates/reducers/templatesReducer';
import * as types from 'app/Templates/actions/actionTypes';

describe('templatesReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state []', () => {
      const newState = reducer();
      expect(newState).toEqual(Immutable.fromJS([]));
    });
  });

  describe('SET_TEMPLATES', () => {
    it('should set templates passed', () => {
      const templates = Immutable.fromJS([{ name: 'new' }]);

      const newState = reducer(null, { type: types.SET_TEMPLATES, templates });

      expect(newState instanceof Immutable.List).toBe(true);
      expect(newState.toJS()).toEqual(templates.toJS());
    });
  });

  describe('DELETE_TEMPLATE', () => {
    it('should delete template by id', () => {
      const state = Immutable.fromJS([{ _id: '1' }, { _id: '2' }, { _id: '3' }]);
      const templateId = '2';

      const newState = reducer(state, { type: types.DELETE_TEMPLATE, id: templateId });

      const expected = Immutable.fromJS([{ _id: '1' }, { _id: '3' }]);
      expect(newState instanceof Immutable.List).toBe(true);
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });
});
