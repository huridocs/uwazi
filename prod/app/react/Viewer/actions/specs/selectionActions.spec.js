"use strict";var actions = _interopRequireWildcard(require("../selectionActions"));
var types = _interopRequireWildcard(require("../actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

describe('selectionActions', () => {
  describe('setSelection()', () => {
    it('should return a SET_SELECTION type action with the selection', () => {
      const action = actions.setSelection('sourceRange');
      expect(action).toEqual({ type: types.SET_SELECTION, sourceRange: 'sourceRange' });
    });
  });
  describe('unsetSelection()', () => {
    it('should return a UNSET_SELECTION type action with the selection', () => {
      const action = actions.unsetSelection();
      expect(action).toEqual({ type: types.UNSET_SELECTION });
    });
  });
  describe('setTargetSelection()', () => {
    it('should return a SET_TARGET_SELECTION type action with the selection', () => {
      const action = actions.setTargetSelection('targetRange');
      expect(action).toEqual({ type: types.SET_TARGET_SELECTION, targetRange: 'targetRange' });
    });
  });
  describe('unsetTargetSelection()', () => {
    it('should return a UNSET_TARGET_SELECTION type action with the selection', () => {
      const action = actions.unsetTargetSelection();
      expect(action).toEqual({ type: types.UNSET_TARGET_SELECTION });
    });
  });
});