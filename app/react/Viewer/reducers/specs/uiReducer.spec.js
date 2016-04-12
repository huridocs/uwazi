import Immutable from 'immutable';
import 'jasmine-immutablejs-matchers';

import uiReducer from 'app/Viewer/reducers/uiReducer';
import * as types from 'app/Viewer/actions/actionTypes';

describe('documentReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state', () => {
      let newState = uiReducer();

      expect(newState).toBeImmutable();
      expect(newState.toJS()).toEqual({});
    });
  });

  describe('OPEN_REFERENCE_PANEL', () => {
    it('should set referencePanel = true', () => {
      let newState = uiReducer(Immutable.fromJS({}), {type: types.OPEN_REFERENCE_PANEL});
      let expected = Immutable.fromJS({referencePanel: true});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('VIEWER_SEARCHING', () => {
    it('should set viewerSearching = true', () => {
      let newState = uiReducer(Immutable.fromJS({}), {type: types.VIEWER_SEARCHING});
      let expected = Immutable.fromJS({viewerSearching: true});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('SET_VIEWER_RESULTS', () => {
    it('should set viewerSearching = false', () => {
      let newState = uiReducer(Immutable.fromJS({}), {type: types.SET_VIEWER_RESULTS});
      let expected = Immutable.fromJS({viewerSearching: false});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('UNSET_SELECTION', () => {
    it('should set referencePanel = false', () => {
      let newState = uiReducer(Immutable.fromJS({referencePanel: true}), {type: types.UNSET_SELECTION});
      let expected = Immutable.fromJS({referencePanel: false});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('SELECT_TARGET_DOCUMENT', () => {
    it('should set targetDocument = id passed', () => {
      let newState = uiReducer(Immutable.fromJS({targetDocument: null}), {type: types.SELECT_TARGET_DOCUMENT, id: 'id'});
      let expected = Immutable.fromJS({targetDocument: 'id'});

      expect(newState).toEqualImmutable(expected);
    });
  });
});
