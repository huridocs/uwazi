"use strict";var actions = _interopRequireWildcard(require("../uiActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

describe('Settings/uiActions', () => {
  describe('editLink', () => {
    it('should return EDIT_LINK', () => {
      expect(actions.editLink('passed_id')).toEqual({ type: 'EDIT_LINK', id: 'passed_id' });
    });
  });
});