"use strict";var _immutable = require("immutable");
require("jasmine-immutablejs-matchers");

var _uiReducer = _interopRequireDefault(require("../uiReducer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Connections uiReducer', () => {
  describe('when state is undefined', () => {
    it('should return a default state', () => {
      const newState = (0, _uiReducer.default)();
      expect(newState.toJS()).toEqual({ open: false, connecting: false });
    });
  });

  describe('OPEN_CONNECTION_PANEL', () => {
    it('should set open true', () => {
      const newState = (0, _uiReducer.default)((0, _immutable.fromJS)({}), { type: 'OPEN_CONNECTION_PANEL' });
      expect(newState.toJS()).toEqual({ open: true });
    });
  });

  describe('CLOSE_CONNECTION_PANEL', () => {
    it('should reset connecting and set open to false', () => {
      const newState = (0, _uiReducer.default)((0, _immutable.fromJS)({}), { type: 'CLOSE_CONNECTION_PANEL' });
      expect(newState.toJS()).toEqual({ connecting: false, open: false });
    });
  });

  describe('SEARCHING_CONNECTIONS', () => {
    it('should set searching to true', () => {
      const newState = (0, _uiReducer.default)((0, _immutable.fromJS)({}), { type: 'SEARCHING_CONNECTIONS' });
      expect(newState.toJS()).toEqual({ searching: true });
    });
  });

  describe('upon setting results', () => {
    it('should set searching to false', () => {
      const newState = (0, _uiReducer.default)((0, _immutable.fromJS)({}), { type: 'connections/searchResults/SET' });
      expect(newState.toJS()).toEqual({ searching: false });
    });
  });

  describe('CREATING_CONNECTION', () => {
    it('should set creating to true', () => {
      const newState = (0, _uiReducer.default)((0, _immutable.fromJS)({}), { type: 'CREATING_CONNECTION' });
      expect(newState.toJS()).toEqual({ creating: true });
    });
  });

  describe('CREATING_RANGED_CONNECTION', () => {
    it('should set connecting to true', () => {
      const newState = (0, _uiReducer.default)((0, _immutable.fromJS)({}), { type: 'CREATING_RANGED_CONNECTION' });
      expect(newState.toJS()).toEqual({ connecting: true });
    });
  });

  describe('CANCEL_RANGED_CONNECTION', () => {
    it('should set connecting to false', () => {
      const newState = (0, _uiReducer.default)((0, _immutable.fromJS)({}), { type: 'CANCEL_RANGED_CONNECTION' });
      expect(newState.toJS()).toEqual({ connecting: false });
    });
  });

  describe('CONNECTION_CREATED', () => {
    it('should reset creating, connecting and close the panel', () => {
      const newState = (0, _uiReducer.default)((0, _immutable.fromJS)({}), { type: 'CONNECTION_CREATED' });
      expect(newState.toJS()).toEqual({ creating: false, connecting: false, open: false });
    });
  });
});