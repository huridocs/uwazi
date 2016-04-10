import Immutable from 'immutable';

import contextMenuReducer from 'app/ContextMenu/reducers/contextMenuReducer';
import * as types from 'app/ContextMenu/actions/actionTypes';
import * as ViewerTypes from 'app/Viewer/actions/actionTypes';
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

  describe('SET_SELECTION', () => {
    it('should set type to ViewerTextSelectedMenu', () => {
      let currentState = Immutable.fromJS({type: null});
      let newState = contextMenuReducer(currentState, {type: ViewerTypes.SET_SELECTION});
      let expected = Immutable.fromJS({type: 'ViewerTextSelectedMenu'});

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('UNSET_SELECTION', () => {
    it('should set type to ViewerDefaultMenu', () => {
      let currentState = Immutable.fromJS({type: null});
      let newState = contextMenuReducer(currentState, {type: ViewerTypes.UNSET_SELECTION});
      let expected = Immutable.fromJS({type: 'ViewerDefaultMenu'});

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('LOAD_DEFAULT_VIEWER_MENU', () => {
    it('should set type to ViewerDefaultMenu', () => {
      let currentState = Immutable.fromJS({type: null});
      let newState = contextMenuReducer(currentState, {type: ViewerTypes.LOAD_DEFAULT_VIEWER_MENU});
      let expected = Immutable.fromJS({type: 'ViewerDefaultMenu'});

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
});
