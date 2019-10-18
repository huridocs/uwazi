"use strict";var _immutable = _interopRequireDefault(require("immutable"));

var _templatesReducer = _interopRequireDefault(require("../templatesReducer"));
var types = _interopRequireWildcard(require("../../actions/actionTypes"));
require("jasmine-immutablejs-matchers");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('templatesReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state []', () => {
      const newState = (0, _templatesReducer.default)();
      expect(newState).toEqual(_immutable.default.fromJS([]));
    });
  });

  describe('SET_TEMPLATES', () => {
    it('should set templates passed', () => {
      const templates = _immutable.default.fromJS([{ name: 'new' }]);

      const newState = (0, _templatesReducer.default)(null, { type: types.SET_TEMPLATES, templates });

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(templates);
    });
  });

  describe('DELETE_TEMPLATE', () => {
    it('should delete template by id', () => {
      const state = _immutable.default.fromJS([{ _id: '1' }, { _id: '2' }, { _id: '3' }]);
      const templateId = '2';

      const newState = (0, _templatesReducer.default)(state, { type: types.DELETE_TEMPLATE, id: templateId });

      const expected = _immutable.default.fromJS([{ _id: '1' }, { _id: '3' }]);
      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
});