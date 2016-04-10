import Immutable from 'immutable';

import contextMenuReducer from 'app/ContextMenu/reducers/contextMenuReducer';
import * as types from 'app/ContextMenu/actions/actionTypes';
import 'jasmine-immutablejs-matchers';

describe('contextMenuReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state', () => {
      let newState = contextMenuReducer();
      expect(newState).toEqual(Immutable.fromJS({open: false, menu: null}));
    });
  });

  describe('OPEN_MENU', () => {
    it('should set open = true', () => {
      let currentState = Immutable.fromJS({open: false});
      let newState = contextMenuReducer(currentState, {type: types.OPEN_MENU});
      let expected = Immutable.fromJS({open: true});

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('CLOSE_MENU', () => {
    it('should set open = false', () => {
      let currentState = Immutable.fromJS({open: true});
      let newState = contextMenuReducer(currentState, {type: types.CLOSE_MENU});
      let expected = Immutable.fromJS({open: false});

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
});
