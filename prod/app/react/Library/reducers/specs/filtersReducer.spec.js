"use strict";var _immutable = _interopRequireDefault(require("immutable"));
var types = _interopRequireWildcard(require("../../actions/actionTypes"));

var _filtersReducer = _interopRequireDefault(require("../filtersReducer"));
require("jasmine-immutablejs-matchers");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('filtersReducer', () => {
  const initialState = _immutable.default.fromJS({ properties: [], documentTypes: [] });

  describe('when state is undefined', () => {
    it('returns initial', () => {
      const newState = (0, _filtersReducer.default)();
      expect(newState).toEqual(initialState);
    });
  });

  const libraryFilters = [{ name: 'country', filter: true, type: 'select', content: 'abc1', options: ['thesauri values'] }];

  describe('SET_LIBRARY_FILTERS', () => {
    it('should set the properties', () => {
      const state = _immutable.default.fromJS({ properties: [] });

      const newState = (0, _filtersReducer.default)(state, { type: types.SET_LIBRARY_FILTERS, libraryFilters });
      expect(newState.get('properties').toJS()).toEqual(libraryFilters);
    });
  });

  describe('INITIALIZE_FILTERS_FORM', () => {
    it('should set the properties', () => {
      const state = _immutable.default.fromJS({ properties: [] });

      const newState = (0, _filtersReducer.default)(state, { type: types.INITIALIZE_FILTERS_FORM, libraryFilters });
      expect(newState.get('properties').toJS()).toEqual(libraryFilters);
    });
  });
});