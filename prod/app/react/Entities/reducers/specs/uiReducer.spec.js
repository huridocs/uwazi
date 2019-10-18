"use strict";var _immutable = _interopRequireDefault(require("immutable"));

var _uiReducer = _interopRequireDefault(require("../uiReducer"));
var actions = _interopRequireWildcard(require("../../actions/uiActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('uiReducer', () => {
  const initialState = _immutable.default.fromJS({});

  describe('when state is undefined', () => {
    it('returns initial', () => {
      const newState = (0, _uiReducer.default)();
      expect(newState).toEqual(initialState);
    });
  });

  describe('when showTab', () => {
    it('should set tab passed and showFilters to false', () => {
      const newState = (0, _uiReducer.default)(initialState, actions.showTab('tab'));
      expect(newState.toJS()).toEqual({ tab: 'tab', showFilters: false });
    });
  });

  describe('when showFilters', () => {
    it('should set tab to connections and filters true', () => {
      const newState = (0, _uiReducer.default)(initialState, actions.showFilters());
      expect(newState.toJS()).toEqual({ tab: 'connections', showFilters: true });
    });
  });

  describe('when hideFilters', () => {
    it('should set tab to connections and filters true', () => {
      const newState = (0, _uiReducer.default)(initialState, actions.hideFilters());
      expect(newState.toJS()).toEqual({ showFilters: false });
    });
  });
});