"use strict";var actions = _interopRequireWildcard(require("../uiActions"));
var types = _interopRequireWildcard(require("../actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

describe('uiActions', () => {
  describe('editProperty()', () => {
    it('should return an EDIT_PROPERTY action with the id', () => {
      const action = actions.editProperty('id');
      expect(action).toEqual({ type: types.EDIT_PROPERTY, id: 'id' });
    });
  });
  describe('setThesauris()', () => {
    it('should return a SET_THESAURI action with the thesauri', () => {
      const action = actions.setThesauris('thesauris');
      expect(action).toEqual({ type: types.SET_THESAURIS, thesauris: 'thesauris' });
    });
  });
});