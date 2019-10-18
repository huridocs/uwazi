"use strict";var _objectWithoutKeys = _interopRequireDefault(require("../objectWithoutKeys"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('objectWithoutKeys', () => {
  let source;

  beforeEach(() => {
    source = { a: 'a', b: 'b', c: 'c', z: 'z' };
  });

  it('should return a copy of the object', () => {
    expect((0, _objectWithoutKeys.default)(source)).not.toBe(source);
    expect((0, _objectWithoutKeys.default)(source)).toEqual(source);
  });

  it('should exclude the selected keys, without failing if key not in original object', () => {
    expect((0, _objectWithoutKeys.default)(source, ['b', 'c', 'y'])).toEqual({ a: 'a', z: 'z' });
  });
});