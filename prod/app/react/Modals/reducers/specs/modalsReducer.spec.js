"use strict";var _immutable = _interopRequireDefault(require("immutable"));
var types = _interopRequireWildcard(require("../../actions/actionTypes"));

var _modalsReducer = _interopRequireDefault(require("../modalsReducer"));
require("jasmine-immutablejs-matchers");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('modalsReducer', () => {
  const initialState = _immutable.default.fromJS({});

  describe('when state is undefined', () => {
    it('returns initial', () => {
      const newState = (0, _modalsReducer.default)();
      expect(newState).toEqual(initialState);
    });
  });

  describe('SHOW_MODAL', () => {
    it('should assign a key with modal name and data', () => {
      const newState = (0, _modalsReducer.default)(initialState, { type: types.SHOW_MODAL, modal: 'modalName', data: 'data' });
      expect(newState.toJS().modalName).toEqual('data');
    });
  });

  describe('HIDE_MODAL', () => {
    it('should delete modal from the state', () => {
      const state = initialState.set('modalName', 1);
      const newState = (0, _modalsReducer.default)(state, { type: types.HIDE_MODAL, modal: 'modalName' });
      expect(newState.toJS()).toEqual({});
    });
  });
});