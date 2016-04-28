import Immutable from 'immutable';

import reducer from 'app/Templates/reducers/uiReducer';
import * as actions from 'app/Templates/actions/actionTypes';
import 'jasmine-immutablejs-matchers';

describe('uiReducer', () => {
  describe('when state is undefined', () => {
    it('should return initial state', () => {
      let newState = reducer();
      expect(newState).toEqual(Immutable.fromJS({thesauris: [], propertyBeingDeleted: null}));
    });
  });

  describe('EDIT_PROPERTY', () => {
    it('should set editingProperty to the action id', () => {
      let newState = reducer(Immutable.fromJS({}), {type: actions.EDIT_PROPERTY, id: 'test id'});
      expect(newState).toEqualImmutable(Immutable.fromJS({editingProperty: 'test id'}));
    });
  });

  describe('SET_THESAURI', () => {
    it('should set thesauri list on thesauri', () => {
      let newState = reducer(Immutable.fromJS({}), {type: actions.SET_THESAURIS, thesauris: 'thesauris'});
      expect(newState).toEqualImmutable(Immutable.fromJS({thesauris: 'thesauris'}));
    });
  });
});
