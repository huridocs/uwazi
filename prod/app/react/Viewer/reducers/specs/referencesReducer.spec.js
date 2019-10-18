"use strict";var _immutable = _interopRequireDefault(require("immutable"));
require("jasmine-immutablejs-matchers");

var _referencesReducer = _interopRequireDefault(require("../referencesReducer"));
var types = _interopRequireWildcard(require("../../actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Viewer referencesReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state', () => {
      const newState = (0, _referencesReducer.default)();

      expect(newState).toBeImmutable();
      expect(newState.toJS()).toEqual([]);
    });
  });

  describe('SET_REFERENCES', () => {
    it('should set document passed', () => {
      const newState = (0, _referencesReducer.default)(null, { type: types.SET_REFERENCES, references: [{ title: 'test' }] });
      const expected = _immutable.default.fromJS([{ title: 'test' }]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('ADD_CREATED_REFERENCE', () => {
    it('should should add reference passed', () => {
      const newState = (0, _referencesReducer.default)(_immutable.default.fromJS([1]), { type: types.ADD_REFERENCE, reference: 2 });
      const expected = _immutable.default.fromJS([1, 2]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('REMOVE_REFERENCE', () => {
    let initialState;

    beforeEach(() => {
      initialState = _immutable.default.fromJS([
      { _id: 'ref1', hub: 'hub1' },
      { _id: 'ref2', hub: 'hub1' },
      { _id: 'ref3', hub: 'hub2' },
      { _id: 'ref4', hub: 'hub2' },
      { _id: 'ref5', hub: 'hub2' }]);

    });

    it('should remove the hub of the reference passed when hub has 2 or less items', () => {
      const action = { type: types.REMOVE_REFERENCE, reference: { _id: 'ref2', hub: 'hub1' } };
      const expectedState = [{ _id: 'ref3', hub: 'hub2' }, { _id: 'ref4', hub: 'hub2' }, { _id: 'ref5', hub: 'hub2' }];
      expect((0, _referencesReducer.default)(initialState, action).toJS()).toEqual(expectedState);
    });

    it('should remove only the associated reference passed when hub has more than 2 items', () => {
      const action = { type: types.REMOVE_REFERENCE, reference: { _id: 'ref3', hub: 'hub2', associatedRelationship: { _id: 'ref4' } } };
      const expectedState = [
      { _id: 'ref1', hub: 'hub1' },
      { _id: 'ref2', hub: 'hub1' },
      { _id: 'ref3', hub: 'hub2' },
      { _id: 'ref5', hub: 'hub2' }];


      expect((0, _referencesReducer.default)(initialState, action).toJS()).toEqual(expectedState);
    });
  });

  describe('RESET_DOCUMENT_VIEWER', () => {
    it('should reset to initialState', () => {
      const newState = (0, _referencesReducer.default)(['reference'], { type: types.RESET_DOCUMENT_VIEWER });
      const expected = _immutable.default.fromJS([]);

      expect(newState).toBeImmutable();
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });
});