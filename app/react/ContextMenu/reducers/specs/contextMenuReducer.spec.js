import Immutable from 'immutable';

import { contextMenuReducer } from '#app/ContextMenu/reducers/contextMenuReducer.js';
import * as types from '#app/ContextMenu/actions/actionTypes.js';
import * as ViewerTypes from '#app/Viewer/actions/actionTypes.js';
import * as LibraryActions from '#app/Library/actions/actionTypes.js';

describe('contextMenuReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state', () => {
      const newState = contextMenuReducer();
      expect(newState).toEqual(Immutable.fromJS({ open: false, menu: null }));
    });
  });

  describe('OPEN_MENU', () => {
    it('should set open = true', () => {
      const currentState = Immutable.fromJS({ open: false });
      const newState = contextMenuReducer(currentState, { type: types.OPEN_MENU });
      const expected = Immutable.fromJS({ open: true });

      expect(newState instanceof Immutable.Map).toBe(true);
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('CLOSE_MENU', () => {
    it('should set open = false', () => {
      const currentState = Immutable.fromJS({ open: true });
      const newState = contextMenuReducer(currentState, { type: types.CLOSE_MENU });
      const expected = Immutable.fromJS({ open: false });

      expect(newState instanceof Immutable.Map).toBe(true);
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('SET_SELECTION', () => {
    it('should set type to ViewerTextSelectedMenu', () => {
      const currentState = Immutable.fromJS({ type: null });
      const newState = contextMenuReducer(currentState, { type: ViewerTypes.SET_SELECTION });
      const expected = Immutable.fromJS({ type: 'ViewerTextSelectedMenu' });

      expect(newState instanceof Immutable.Map).toBe(true);
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('UNSET_SELECTION', () => {
    it('should set type to ViewerDefaultMenu', () => {
      const currentState = Immutable.fromJS({ type: null });
      const newState = contextMenuReducer(currentState, { type: ViewerTypes.UNSET_SELECTION });
      const expected = Immutable.fromJS({ type: 'ViewerDefaultMenu' });

      expect(newState instanceof Immutable.Map).toBe(true);
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('ADD_REFERENCE', () => {
    it('should set type to ViewerDefaultMenu', () => {
      const currentState = Immutable.fromJS({ type: null });
      const newState = contextMenuReducer(currentState, { type: ViewerTypes.ADD_REFERENCE });
      const expected = Immutable.fromJS({ type: 'ViewerDefaultMenu' });

      expect(newState instanceof Immutable.Map).toBe(true);
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('LOAD_DEFAULT_VIEWER_MENU', () => {
    it('should set type to ViewerDefaultMenu', () => {
      const currentState = Immutable.fromJS({ type: null });
      const newState = contextMenuReducer(currentState, {
        type: ViewerTypes.LOAD_DEFAULT_VIEWER_MENU,
      });
      const expected = Immutable.fromJS({ type: 'ViewerDefaultMenu' });

      expect(newState instanceof Immutable.Map).toBe(true);
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });
  describe('OPEN_PANEL with viewMetadataPanel', () => {
    it('should set type to ViewMetadataMenu', () => {
      const currentState = Immutable.fromJS({ type: null });
      const newState = contextMenuReducer(currentState, {
        type: ViewerTypes.OPEN_PANEL,
        panel: 'viewMetadataPanel',
      });
      const expected = Immutable.fromJS({ type: 'MetadataPanelMenu' });

      expect(newState instanceof Immutable.Map).toBe(true);
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });
  describe('OPEN_PANEL with referencePanel', () => {
    it('should set type to ViewerSaveReferenceMenu', () => {
      const currentState = Immutable.fromJS({ type: null });
      const newState = contextMenuReducer(currentState, {
        type: ViewerTypes.OPEN_PANEL,
        panel: 'referencePanel',
      });
      const expected = Immutable.fromJS({ type: 'ViewerSaveReferenceMenu' });

      expect(newState instanceof Immutable.Map).toBe(true);
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });
  describe('OPEN_PANEL with targetReferencePanel', () => {
    it('should set type to ViewerSaveTargetReferenceMenu', () => {
      const currentState = Immutable.fromJS({ type: null });
      const newState = contextMenuReducer(currentState, {
        type: ViewerTypes.OPEN_PANEL,
        panel: 'targetReferencePanel',
      });
      const expected = Immutable.fromJS({ type: 'ViewerSaveTargetReferenceMenu' });

      expect(newState instanceof Immutable.Map).toBe(true);
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });
  describe('ENTER_LIBRARY', () => {
    it('should set type to LibraryMenu', () => {
      const currentState = Immutable.fromJS({ type: null });
      const newState = contextMenuReducer(currentState, { type: LibraryActions.ENTER_LIBRARY });
      const expected = Immutable.fromJS({ type: 'LibraryMenu' });

      expect(newState instanceof Immutable.Map).toBe(true);
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });
});
