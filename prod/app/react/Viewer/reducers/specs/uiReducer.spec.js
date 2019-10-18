"use strict";var _immutable = _interopRequireDefault(require("immutable"));
require("jasmine-immutablejs-matchers");

var _uiReducer = _interopRequireDefault(require("../uiReducer"));
var types = _interopRequireWildcard(require("../../actions/actionTypes"));
var actions = _interopRequireWildcard(require("../../actions/uiActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Viewer uiReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state', () => {
      const newState = (0, _uiReducer.default)();

      expect(newState).toBeImmutable();
      expect(newState.toJS()).toEqual({ reference: {}, snippet: {} });
    });
  });

  describe('setGoToActive', () => {
    it('should set goToActive to true by default', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({}), actions.goToActive());
      const expected = _immutable.default.fromJS({ goToActive: true });

      expect(newState).toEqualImmutable(expected);
    });

    it('should set goToActive to value passed', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({}), actions.goToActive(false));
      const expected = _immutable.default.fromJS({ goToActive: false });

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('CLOSE_PANEL', () => {
    it('should set panel = false', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({ panel: 'somePanel' }), { type: types.CLOSE_PANEL });
      const expected = _immutable.default.fromJS({ panel: false });

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('OPEN_PANEL', () => {
    it('should set panel = to the panel passed', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({}), { type: types.OPEN_PANEL, panel: 'a panel' });
      const expected = _immutable.default.fromJS({ panel: 'a panel' });

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('viewer/targetDocHTML/SET', () => {
    it('should set panel to false', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({ panel: 'apanel' }), { type: 'viewer/targetDocHTML/SET' });
      const expected = _immutable.default.fromJS({ panel: false });

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('RESET_REFERENCE_CREATION', () => {
    it('should set reference to {}', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({ reference: 'current' }), { type: types.RESET_REFERENCE_CREATION });
      const expected = _immutable.default.fromJS({ reference: {} });

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('viewer/documentResults/SET', () => {
    it('should set viewerSearching = false', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({}), { type: 'viewer/documentResults/SET', value: [] });
      const expected = _immutable.default.fromJS({ viewerSearching: false });

      expect(newState).toEqualImmutable(expected);
    });

    it('should mantain targetDocument if in results', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS(
      { reference: { targetDocument: 'targetId' } }),
      { type: 'viewer/documentResults/SET', value: [{ _id: 'targetId' }, { _id: 'anotherId' }] });

      const expected = _immutable.default.fromJS({ reference: { targetDocument: 'targetId' }, viewerSearching: false });

      expect(newState).toEqualImmutable(expected);
    });

    it('should remove targetDocument if not in results', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS(
      { reference: { targetDocument: 'notInResultsId' } }),
      { type: 'viewer/documentResults/SET', value: [{ _id: 'targetId' }] });

      const expected = _immutable.default.fromJS({ reference: {}, viewerSearching: false });

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('SELECT_TARGET_DOCUMENT', () => {
    it('should set targetDocument = id passed', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({ reference: {} }), { type: types.SELECT_TARGET_DOCUMENT, id: 'id' });
      const expected = _immutable.default.fromJS({ reference: { targetDocument: 'id' } });

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('SELECT_SNIPPET', () => {
    it('should set the snippet', () => {
      const snippet = { text: 'human rights', page: 4 };
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({ reference: {}, snippet: {} }), { type: types.SELECT_SNIPPET, snippet });
      const expected = _immutable.default.fromJS({ reference: {}, snippet });
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });

  describe('SET_SELECTION', () => {
    it('should set sourceRange passed', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({}), { type: types.SET_SELECTION, sourceRange: 'sourceRange' });
      const expected = _immutable.default.fromJS({ reference: { sourceRange: 'sourceRange' } });

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('UNSET_SELECTION', () => {
    it('should set sourceRange to null', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({ reference: { sourceRange: 'sourceRange' } }), { type: types.UNSET_SELECTION });
      const expected = _immutable.default.fromJS({ reference: { sourceRange: null } });

      expect(newState).toEqualImmutable(expected);
    });

    describe('when panel is referencePanel or targetReferencePanel', () => {
      it('should set panel = false', () => {
        let newState = (0, _uiReducer.default)(_immutable.default.fromJS({ panel: 'referencePanel' }), { type: types.UNSET_SELECTION });
        expect(newState.get('panel')).toBe(false);

        newState = (0, _uiReducer.default)(_immutable.default.fromJS({ panel: 'targetReferencePanel' }), { type: types.UNSET_SELECTION });
        expect(newState.get('panel')).toBe(false);

        newState = (0, _uiReducer.default)(_immutable.default.fromJS({ panel: 'otherPanel' }), { type: types.UNSET_SELECTION });
        expect(newState.get('panel')).toBe('otherPanel');
      });
    });
  });

  describe('SET_TARGET_SELECTION', () => {
    it('should set targetRange passed', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({}), { type: types.SET_TARGET_SELECTION, targetRange: 'targetRange' });
      const expected = _immutable.default.fromJS({ reference: { targetRange: 'targetRange' } });

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('unsetTargetSelection', () => {
    it('should set targetRange to null', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({ reference: { targetRange: 'targetRange' } }), { type: types.UNSET_TARGET_SELECTION });
      const expected = _immutable.default.fromJS({ reference: { targetRange: null } });

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('ADD_REFERENCE', () => {
    it('should set reference = {} and panel=false', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS(
      { panel: 'panel', reference: { sourceRange: 'sourceRange' } }),
      { type: types.ADD_REFERENCE });
      const expected = _immutable.default.fromJS({ panel: false, reference: {} });

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('HIGHLIGHT_REFERENCE', () => {
    it('should set highlightedReference to reference id passed', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({}), { type: types.HIGHLIGHT_REFERENCE, reference: 'reference' });
      const expected = _immutable.default.fromJS({ highlightedReference: 'reference' });

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('ACTIVE_REFERENCE', () => {
    it('should set highlightedReference to reference id passed', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({ activeReference: 'reference' }), { type: types.DEACTIVATE_REFERENCE });
      const expected = _immutable.default.fromJS({});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('ACTIVE_REFERENCE', () => {
    it('should set highlightedReference to reference id passed', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({}), { type: types.ACTIVE_REFERENCE, reference: 'reference' });
      const expected = _immutable.default.fromJS({ activeReference: 'reference' });

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('RESET_DOCUMENT_VIEWER', () => {
    it('should set initialState', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({ targetDocument: 1, panel: true }), { type: types.RESET_DOCUMENT_VIEWER });
      const expected = _immutable.default.fromJS({ reference: {}, snippet: {} });

      expect(newState).toEqualImmutable(expected);
    });
  });
});