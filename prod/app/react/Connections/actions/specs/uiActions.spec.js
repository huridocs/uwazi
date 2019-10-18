"use strict";var uiActions = _interopRequireWildcard(require("../uiActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

describe('Connections uiActions', () => {
  describe('openPanel', () => {
    it('should broadcast OPEN_CONNECTION_PANEL with values', () => {
      expect(uiActions.openPanel('type', 'sourceId')).toEqual({ type: 'OPEN_CONNECTION_PANEL', sourceDocument: 'sourceId', connectionType: 'type' });
    });
  });

  describe('closePanel', () => {
    it('should broadcast CLOSE_CONNECTION_PANEL', () => {
      expect(uiActions.closePanel()).toEqual({ type: 'CLOSE_CONNECTION_PANEL' });
    });
  });

  describe('searching', () => {
    it('should broadcast SEARCHING_CONNECTIONS', () => {
      expect(uiActions.searching()).toEqual({ type: 'SEARCHING_CONNECTIONS' });
    });
  });
});