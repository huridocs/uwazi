"use strict";var actions = _interopRequireWildcard(require("../contextMenuActions"));
var types = _interopRequireWildcard(require("../actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

describe('contextMenuActions', () => {
  describe('openMenu()', () => {
    it('should return a OPEN_MENU type action', () => {
      const action = actions.openMenu();
      expect(action).toEqual({ type: types.OPEN_MENU });
    });
  });

  describe('closeMenu()', () => {
    it('should return a CLOSE_MENU type action', () => {
      const action = actions.closeMenu();
      expect(action).toEqual({ type: types.CLOSE_MENU });
    });
  });
});