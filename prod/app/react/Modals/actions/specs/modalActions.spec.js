"use strict";var actions = _interopRequireWildcard(require("../modalActions"));
var types = _interopRequireWildcard(require("../actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

describe('modalsActions', () => {
  describe('showModal', () => {
    it('should return a SHOW_MODAL action with modal name and data', () => {
      const action = actions.showModal('modalName', { data: 'data' });
      expect(action).toEqual({ type: types.SHOW_MODAL, modal: 'modalName', data: { data: 'data' } });
    });
  });
  describe('hideModal', () => {
    it('should return a HIDE_MODAL action with modal name', () => {
      const action = actions.hideModal('modalName');
      expect(action).toEqual({ type: types.HIDE_MODAL, modal: 'modalName' });
    });
  });
});