"use strict";var _immutable = require("immutable");

var actions = _interopRequireWildcard(require("../../actions/actionTypes"));
var _uiReducer = _interopRequireDefault(require("../uiReducer"));
require("jasmine-immutablejs-matchers");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

describe('uiReducer', () => {
  describe('when state is undefined', () => {
    it('should return initial state', () => {
      const newState = (0, _uiReducer.default)();
      expect(newState).toEqual((0, _immutable.fromJS)({}));
    });
  });

  describe('EDIT_LINK', () => {
    it('should set savingPage true', () => {
      const newState = (0, _uiReducer.default)((0, _immutable.fromJS)({}), { type: actions.EDIT_LINK, id: 5 });
      expect(newState).toEqualImmutable((0, _immutable.fromJS)({ editingLink: 5 }));
    });
  });

  describe('SAVING_NAVLINKS', () => {
    it('should set savingNavlinks true', () => {
      const newState = (0, _uiReducer.default)((0, _immutable.fromJS)({}), { type: actions.SAVING_NAVLINKS });
      expect(newState).toEqualImmutable((0, _immutable.fromJS)({ savingNavlinks: true }));
    });
  });

  describe('NAVLINKS_SAVED', () => {
    it('should set savingNavlinks false', () => {
      const newState = (0, _uiReducer.default)((0, _immutable.fromJS)({}), { type: actions.NAVLINKS_SAVED });
      expect(newState).toEqualImmutable((0, _immutable.fromJS)({ savingNavlinks: false }));
    });
  });
});