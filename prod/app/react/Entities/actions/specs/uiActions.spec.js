"use strict";var uiActions = _interopRequireWildcard(require("../uiActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

describe('Entities uiActions', () => {
  describe('showTab', () => {
    it('should broadcast SHOW_TAB with values', () => {
      expect(uiActions.showTab('tab')).toEqual({ type: 'SHOW_TAB', tab: 'tab' });
    });
  });
});