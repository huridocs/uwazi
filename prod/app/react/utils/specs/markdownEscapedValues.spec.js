"use strict";var _markdownEscapedValues = _interopRequireDefault(require("../markdownEscapedValues"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('markdownEscapedValues', () => {
  it('should return an emtpy array when no match found', () => {
    expect((0, _markdownEscapedValues.default)(null, '(...)')).toEqual([]);
    expect((0, _markdownEscapedValues.default)('', '(...)')).toEqual([]);
    expect((0, _markdownEscapedValues.default)('Unmatched text', '(...)')).toEqual([]);
  });

  it('should extract found matches, even in nested configurations', () => {
    expect((0, _markdownEscapedValues.default)('This is a (match)', '(...)')).toEqual(['match']);

    expect((0, _markdownEscapedValues.default)('This should also (match(as(nested(parenthesis),with more data)))', '(...)')).
    toEqual(['match(as(nested(parenthesis),with more data))']);
  });

  it('should extract matches with custom escape code only, and avoid other type of escapes that may use similar patters', () => {
    expect((0, _markdownEscapedValues.default)('This {should}(not match), this is a {a}(match), this other [a](should not)', '(...)', '{a}')).
    toEqual(['match']);

    expect((0, _markdownEscapedValues.default)('This {should}(not match), this is a {a}(should(match)), this other {a}(too)', '(...)', '{a}')).
    toEqual(['should(match)', 'too']);
  });
});