import Immutable from 'immutable';

import uiReducer from 'app/Viewer/reducers/uiReducer';
import * as types from 'app/Viewer/actions/actionTypes';
import * as actions from 'app/Viewer/actions/uiActions';

describe('Viewer uiReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state', () => {
      const newState = uiReducer();

      expect(newState instanceof Immutable.Map).toBe(true);
      expect(newState.toJS()).toEqual({
        reference: {},
        snippet: {},
        enableClickAction: true,
        activeReferences: [],
      });
    });
  });

  describe('setGoToActive', () => {
    it('should set goToActive to true by default', () => {
      const newState = uiReducer(Immutable.fromJS({}), actions.goToActive());
      const expected = Immutable.fromJS({ goToActive: true });

      expect(newState.toJS()).toEqual(expected.toJS());
    });

    it('should set goToActive to value passed', () => {
      const newState = uiReducer(Immutable.fromJS({}), actions.goToActive(false));
      const expected = Immutable.fromJS({ goToActive: false });

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('CLOSE_PANEL', () => {
    it('should set panel = false', () => {
      const newState = uiReducer(Immutable.fromJS({ panel: 'somePanel' }), {
        type: types.CLOSE_PANEL,
      });
      const expected = Immutable.fromJS({ panel: false });

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('OPEN_PANEL', () => {
    it('should set panel = to the panel passed', () => {
      const newState = uiReducer(Immutable.fromJS({}), {
        type: types.OPEN_PANEL,
        panel: 'a panel',
      });
      const expected = Immutable.fromJS({ panel: 'a panel' });

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('viewer/targetDocHTML/SET', () => {
    it('should set panel to false', () => {
      const newState = uiReducer(Immutable.fromJS({ panel: 'apanel' }), {
        type: 'viewer/targetDocHTML/SET',
      });
      const expected = Immutable.fromJS({ panel: false });

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('RESET_REFERENCE_CREATION', () => {
    it('should set reference to {}', () => {
      const newState = uiReducer(Immutable.fromJS({ reference: 'current' }), {
        type: types.RESET_REFERENCE_CREATION,
      });
      const expected = Immutable.fromJS({ reference: {} });

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('viewer/documentResults/SET', () => {
    it('should set viewerSearching = false', () => {
      const newState = uiReducer(Immutable.fromJS({}), {
        type: 'viewer/documentResults/SET',
        value: [],
      });
      const expected = Immutable.fromJS({ viewerSearching: false });

      expect(newState.toJS()).toEqual(expected.toJS());
    });

    it('should mantain targetDocument if in results', () => {
      const newState = uiReducer(Immutable.fromJS({ reference: { targetDocument: 'targetId' } }), {
        type: 'viewer/documentResults/SET',
        value: [{ _id: 'targetId' }, { _id: 'anotherId' }],
      });
      const expected = Immutable.fromJS({
        reference: { targetDocument: 'targetId' },
        viewerSearching: false,
      });

      expect(newState.toJS()).toEqual(expected.toJS());
    });

    it('should remove targetDocument if not in results', () => {
      const newState = uiReducer(
        Immutable.fromJS({ reference: { targetDocument: 'notInResultsId' } }),
        { type: 'viewer/documentResults/SET', value: [{ _id: 'targetId' }] }
      );
      const expected = Immutable.fromJS({ reference: {}, viewerSearching: false });

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('SELECT_TARGET_DOCUMENT', () => {
    it('should set targetDocument = id passed', () => {
      const newState = uiReducer(Immutable.fromJS({ reference: {} }), {
        type: types.SELECT_TARGET_DOCUMENT,
        id: 'id',
      });
      const expected = Immutable.fromJS({ reference: { targetDocument: 'id' } });

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('SELECT_SNIPPET', () => {
    it('should set the snippet', () => {
      const snippet = { text: 'human rights', page: 4 };
      const newState = uiReducer(Immutable.fromJS({ reference: {}, snippet: {} }), {
        type: types.SELECT_SNIPPET,
        snippet,
      });
      const expected = Immutable.fromJS({ reference: {}, snippet });
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('SET_SELECTION', () => {
    it('should set sourceRange passed', () => {
      const newState = uiReducer(Immutable.fromJS({}), {
        type: types.SET_SELECTION,
        sourceRange: 'sourceRange',
        sourceFile: '123',
      });
      const expected = Immutable.fromJS({
        reference: { sourceRange: 'sourceRange', sourceFile: '123' },
      });

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('UNSET_SELECTION', () => {
    it('should set sourceRange and sourceFile to null', () => {
      const newState = uiReducer(Immutable.fromJS({ reference: { sourceRange: 'sourceRange' } }), {
        type: types.UNSET_SELECTION,
      });
      const expected = Immutable.fromJS({ reference: { sourceRange: null, sourceFile: null } });

      expect(newState.toJS()).toEqual(expected.toJS());
    });

    describe('when panel is referencePanel or targetReferencePanel', () => {
      it('should set panel = false', () => {
        let newState = uiReducer(Immutable.fromJS({ panel: 'referencePanel' }), {
          type: types.UNSET_SELECTION,
        });
        expect(newState.get('panel')).toBe(false);

        newState = uiReducer(Immutable.fromJS({ panel: 'targetReferencePanel' }), {
          type: types.UNSET_SELECTION,
        });
        expect(newState.get('panel')).toBe(false);

        newState = uiReducer(Immutable.fromJS({ panel: 'otherPanel' }), {
          type: types.UNSET_SELECTION,
        });
        expect(newState.get('panel')).toBe('otherPanel');
      });
    });
  });

  describe('SET_TARGET_SELECTION', () => {
    it('should set targetRange and targetFile passed', () => {
      const newState = uiReducer(Immutable.fromJS({}), {
        type: types.SET_TARGET_SELECTION,
        targetRange: 'targetRange',
        targetFile: '123',
      });
      const expected = Immutable.fromJS({
        reference: { targetRange: 'targetRange', targetFile: '123' },
      });

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('unsetTargetSelection', () => {
    it('should set targetRange and targetFile to null', () => {
      const newState = uiReducer(Immutable.fromJS({ reference: { targetRange: 'targetRange' } }), {
        type: types.UNSET_TARGET_SELECTION,
      });
      const expected = Immutable.fromJS({ reference: { targetRange: null, targetFile: null } });

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('ADD_REFERENCE', () => {
    it('should set reference = {} and panel=false', () => {
      const newState = uiReducer(
        Immutable.fromJS({ panel: 'panel', reference: { sourceRange: 'sourceRange' } }),
        { type: types.ADD_REFERENCE }
      );
      const expected = Immutable.fromJS({ panel: false, reference: {} });

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('HIGHLIGHT_REFERENCE', () => {
    it('should set highlightedReference to reference id passed', () => {
      const newState = uiReducer(Immutable.fromJS({}), {
        type: types.HIGHLIGHT_REFERENCE,
        reference: 'reference',
      });
      const expected = Immutable.fromJS({ highlightedReference: 'reference' });

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('ACTIVE_REFERENCE', () => {
    it('should set highlightedReference to reference id passed', () => {
      const newState = uiReducer(Immutable.fromJS({ activeReference: 'reference' }), {
        type: types.DEACTIVATE_REFERENCE,
      });
      const expected = Immutable.fromJS({});

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('ACTIVE_REFERENCE', () => {
    it('should set highlightedReference to reference id passed', () => {
      const newState = uiReducer(Immutable.fromJS({}), {
        type: types.ACTIVE_REFERENCE,
        reference: 'reference',
      });
      const expected = Immutable.fromJS({ activeReference: 'reference' });

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('TOGGLE_REFERENCES', () => {
    it('should toggle if click action state', () => {
      const newState = uiReducer(Immutable.fromJS({ enableClickAction: true }), {
        type: types.TOGGLE_REFERENCES,
      });
      const expected = Immutable.fromJS({ enableClickAction: false });

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('RESET_DOCUMENT_VIEWER', () => {
    it('should set initialState', () => {
      const newState = uiReducer(Immutable.fromJS({ targetDocument: 1, panel: true }), {
        type: types.RESET_DOCUMENT_VIEWER,
      });
      const expected = Immutable.fromJS({
        reference: {},
        snippet: {},
        enableClickAction: true,
        activeReferences: [],
      });

      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });
});
