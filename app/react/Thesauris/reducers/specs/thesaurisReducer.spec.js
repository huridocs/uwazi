import Immutable from 'immutable';
import * as actions from '~/Thesauris/actions/thesaurisActions';
import * as types from '~/Thesauris/actions/actionTypes';

import thesaurisReducer from '~/Thesauris/reducers/thesaurisReducer';
import 'jasmine-immutablejs-matchers';

describe('thesauriReducer', () => {
  describe('when state is undefined', () => {
    it('returns initial', () => {
      let newState = thesaurisReducer();
      expect(newState).toEqualImmutable(Immutable.fromJS([]));
    });
  });

  describe('SET_THESAURIS', () => {
    it('should set the given thesauri in the state to be edited', () => {
      let thesauris = [{name: 'Edit me!', values: []}];
      let newState = thesaurisReducer([], actions.setThesauris(thesauris));
      expect(newState).toEqualImmutable(Immutable.fromJS(thesauris));
    });
  });

  describe('THESAURI_DELETED', () => {
    it('should remove it from the thesauris list', () => {
      let state = Immutable.fromJS([{_id: 1, name: 'Edit me!', values: []}, {_id: 2, name: 'Edit me!', values: []}]);
      let action = {type: types.THESAURI_DELETED, id: 1};
      let newState = thesaurisReducer(state, action);
      expect(newState).toEqualImmutable(Immutable.fromJS([{_id: 2, name: 'Edit me!', values: []}]));
    });
  });
});
