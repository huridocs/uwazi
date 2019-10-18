"use strict";var _immutable = _interopRequireDefault(require("immutable"));

var _notificationsReducer = _interopRequireDefault(require("../notificationsReducer"));
var types = _interopRequireWildcard(require("../../actions/actionTypes"));
require("jasmine-immutablejs-matchers");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('templateReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state []', () => {
      const newState = (0, _notificationsReducer.default)();
      expect(newState).toEqual(_immutable.default.fromJS([]));
    });
  });

  describe('NOTIFY', () => {
    it('should add a notification', () => {
      const currentState = _immutable.default.fromJS([{ message: 'message' }]);
      const newState = (0, _notificationsReducer.default)(currentState, { type: types.NOTIFY, notification: { message: 'another message' } });
      const expected = _immutable.default.fromJS([{ message: 'message' }, { message: 'another message' }]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('REMOVE_NOTIFICATION', () => {
    it('should add a notification', () => {
      const currentState = _immutable.default.fromJS([{ id: 1 }, { id: 2 }]);
      const newState = (0, _notificationsReducer.default)(currentState, { type: types.REMOVE_NOTIFICATION, id: 2 });
      const expected = _immutable.default.fromJS([{ id: 1 }]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
});