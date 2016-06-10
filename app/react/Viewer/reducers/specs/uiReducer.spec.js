import Immutable from 'immutable';
import 'jasmine-immutablejs-matchers';

import uiReducer from 'app/Viewer/reducers/uiReducer';
import * as types from 'app/Viewer/actions/actionTypes';

describe('documentReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state', () => {
      let newState = uiReducer();

      expect(newState).toBeImmutable();
      expect(newState.toJS()).toEqual({reference: {}});
    });
  });

  describe('CLOSE_PANEL', () => {
    it('should set panel = false', () => {
      let newState = uiReducer(Immutable.fromJS({panel: 'somePanel'}), {type: types.CLOSE_PANEL});
      let expected = Immutable.fromJS({panel: false});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('OPEN_PANEL', () => {
    it('should set panel = to the panel passed', () => {
      let newState = uiReducer(Immutable.fromJS({}), {type: types.OPEN_PANEL, panel: 'a panel'});
      let expected = Immutable.fromJS({panel: 'a panel'});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('viewer/targetDocHTML/SET', () => {
    it('should set panel to false', () => {
      let newState = uiReducer(Immutable.fromJS({panel: 'apanel'}), {type: 'viewer/targetDocHTML/SET'});
      let expected = Immutable.fromJS({panel: false});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('RESET_REFERENCE_CREATION', () => {
    it('should set reference to {}', () => {
      let newState = uiReducer(Immutable.fromJS({reference: 'current'}), {type: types.RESET_REFERENCE_CREATION});
      let expected = Immutable.fromJS({reference: {}});

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

  describe('viewer/documentResults/SET', () => {
    it('should set viewerSearching = false', () => {
      let newState = uiReducer(Immutable.fromJS({}), {type: 'viewer/documentResults/SET', value: []});
      let expected = Immutable.fromJS({viewerSearching: false});

      expect(newState).toEqualImmutable(expected);
    });

    it('should mantain targetDocument if in results', () => {
      let newState = uiReducer(Immutable.fromJS(
        {reference: {targetDocument: 'targetId'}}),
        {type: 'viewer/documentResults/SET', value: [{_id: 'targetId'}, {_id: 'anotherId'}]}
      );
      let expected = Immutable.fromJS({reference: {targetDocument: 'targetId'}, viewerSearching: false});

      expect(newState).toEqualImmutable(expected);
    });

    it('should remove targetDocument if not in results', () => {
      let newState = uiReducer(Immutable.fromJS(
        {reference: {targetDocument: 'notInResultsId'}}),
        {type: 'viewer/documentResults/SET', value: [{_id: 'targetId'}]}
      );
      let expected = Immutable.fromJS({reference: {}, viewerSearching: false});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('SELECT_TARGET_DOCUMENT', () => {
    it('should set targetDocument = id passed', () => {
      let newState = uiReducer(Immutable.fromJS({reference: {}}), {type: types.SELECT_TARGET_DOCUMENT, id: 'id'});
      let expected = Immutable.fromJS({reference: {targetDocument: 'id'}});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('SET_RELATION_TYPE', () => {
    it('should set sourceRange passed', () => {
      let newState = uiReducer(Immutable.fromJS({}), {type: types.SET_RELATION_TYPE, relationType: 'type'});
      let expected = Immutable.fromJS({reference: {relationType: 'type'}});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('SET_SELECTION', () => {
    it('should set sourceRange passed', () => {
      let newState = uiReducer(Immutable.fromJS({}), {type: types.SET_SELECTION, sourceRange: 'sourceRange'});
      let expected = Immutable.fromJS({reference: {sourceRange: 'sourceRange'}});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('UNSET_SELECTION', () => {
    it('should set sourceRange to null', () => {
      let newState = uiReducer(Immutable.fromJS({reference: {sourceRange: 'sourceRange'}}), {type: types.UNSET_SELECTION});
      let expected = Immutable.fromJS({reference: {sourceRange: null}});

      expect(newState).toEqualImmutable(expected);
    });

    describe('when panel is referencePanel or targetReferencePanel', () => {
      it('should set panel = false', () => {
        let newState = uiReducer(Immutable.fromJS({panel: 'referencePanel'}), {type: types.UNSET_SELECTION});
        expect(newState.get('panel')).toBe(false);

        newState = uiReducer(Immutable.fromJS({panel: 'targetReferencePanel'}), {type: types.UNSET_SELECTION});
        expect(newState.get('panel')).toBe(false);

        newState = uiReducer(Immutable.fromJS({panel: 'otherPanel'}), {type: types.UNSET_SELECTION});
        expect(newState.get('panel')).toBe('otherPanel');
      });
    });
  });

  describe('SET_TARGET_SELECTION', () => {
    it('should set targetRange passed', () => {
      let newState = uiReducer(Immutable.fromJS({}), {type: types.SET_TARGET_SELECTION, targetRange: 'targetRange'});
      let expected = Immutable.fromJS({reference: {targetRange: 'targetRange'}});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('unsetTargetSelection', () => {
    it('should set targetRange to null', () => {
      let newState = uiReducer(Immutable.fromJS({reference: {targetRange: 'targetRange'}}), {type: types.UNSET_TARGET_SELECTION});
      let expected = Immutable.fromJS({reference: {targetRange: null}});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('ADD_CREATED_REFERENCE', () => {
    it('should set reference = {} and panel=false', () => {
      let newState = uiReducer(Immutable.fromJS(
        {panel: 'panel', reference: {sourceRange: 'sourceRange'}}
      ), {type: types.ADD_CREATED_REFERENCE});
      let expected = Immutable.fromJS({panel: false, reference: {}});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('HIGHLIGHT_REFERENCE', () => {
    it('should set highlightedReference to reference id passed', () => {
      let newState = uiReducer(Immutable.fromJS({}), {type: types.HIGHLIGHT_REFERENCE, reference: 'reference'});
      let expected = Immutable.fromJS({highlightedReference: 'reference'});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('ACTIVE_REFERENCE', () => {
    it('should set highlightedReference to reference id passed', () => {
      let newState = uiReducer(Immutable.fromJS({}), {type: types.ACTIVE_REFERENCE, reference: 'reference'});
      let expected = Immutable.fromJS({activeReference: 'reference'});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('RESET_DOCUMENT_VIEWER', () => {
    it('should set initialState', () => {
      let newState = uiReducer(Immutable.fromJS({targetDocument: 1, panel: true}), {type: types.RESET_DOCUMENT_VIEWER});
      let expected = Immutable.fromJS({reference: {}});

      expect(newState).toEqualImmutable(expected);
    });
  });
});
