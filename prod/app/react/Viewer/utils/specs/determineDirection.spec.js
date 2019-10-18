"use strict";var _determineDirection = _interopRequireDefault(require("../determineDirection"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('determineDirection (LTR or RTL)', () => {
  it('should return LTR for most cases', () => {
    expect((0, _determineDirection.default)({ language: 'eng' })).toBe('force-ltr');
    expect((0, _determineDirection.default)({})).toBe('force-ltr');
  });

  it('should return RTL for specific languages', () => {
    expect((0, _determineDirection.default)({ language: 'arb' })).toBe('force-rtl');
    expect((0, _determineDirection.default)({ language: 'fas' })).toBe('force-rtl');
  });
});