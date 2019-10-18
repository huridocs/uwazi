"use strict";var _immutable = _interopRequireDefault(require("immutable"));
var actions = _interopRequireWildcard(require("../../actions/libraryActions"));

var _aggregationsReducer = _interopRequireDefault(require("../aggregationsReducer"));
require("jasmine-immutablejs-matchers");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('aggregationsReducer', () => {
  const initialState = _immutable.default.fromJS({});

  describe('when state is undefined', () => {
    it('returns initial', () => {
      const newState = (0, _aggregationsReducer.default)();
      expect(newState).toEqual(initialState);
    });
  });

  describe('initializeFiltersForm()', () => {
    it('should set the properties', () => {
      const state = _immutable.default.fromJS({});

      const newState = (0, _aggregationsReducer.default)(state, actions.initializeFiltersForm({ aggregations: 'aggregations' }));
      expect(newState).toBe('aggregations');
    });
  });
});