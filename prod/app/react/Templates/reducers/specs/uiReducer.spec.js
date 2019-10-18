"use strict";var _immutable = _interopRequireDefault(require("immutable"));

var _uiReducer = _interopRequireDefault(require("../uiReducer"));
var actions = _interopRequireWildcard(require("../../actions/actionTypes"));
require("jasmine-immutablejs-matchers");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('uiReducer', () => {
  describe('when state is undefined', () => {
    it('should return initial state', () => {
      const newState = (0, _uiReducer.default)();
      expect(newState).toEqual(_immutable.default.fromJS({ thesauris: [], templates: [], propertyBeingDeleted: null }));
    });
  });

  describe('SAVING_TEMPLATE', () => {
    it('should set savingTemplate true', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({}), { type: actions.SAVING_TEMPLATE });
      expect(newState).toEqualImmutable(_immutable.default.fromJS({ savingTemplate: true }));
    });
  });

  describe('TEMPLATE_SAVED', () => {
    it('should set savingTemplate false', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({}), { type: actions.TEMPLATE_SAVED });
      expect(newState).toEqualImmutable(_immutable.default.fromJS({ savingTemplate: false }));
    });
  });

  describe('EDIT_PROPERTY', () => {
    it('should set editingProperty to the action id', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({}), { type: actions.EDIT_PROPERTY, id: 'test id' });
      expect(newState).toEqualImmutable(_immutable.default.fromJS({ editingProperty: 'test id' }));
    });
  });

  describe('SET_THESAURIS', () => {
    it('should set thesauris list on thesauris', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({}), { type: actions.SET_THESAURIS, thesauris: 'thesauris' });
      expect(newState).toEqualImmutable(_immutable.default.fromJS({ thesauris: 'thesauris' }));
    });
  });

  describe('SET_TEMPLATES', () => {
    it('should set templates list on templates', () => {
      const newState = (0, _uiReducer.default)(_immutable.default.fromJS({}), { type: actions.SET_TEMPLATES, templates: 'templates' });
      expect(newState).toEqualImmutable(_immutable.default.fromJS({ templates: 'templates' }));
    });
  });
});