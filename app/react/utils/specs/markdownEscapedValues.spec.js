import markdownEscapedValues from '../markdownEscapedValues';

describe('markdownEscapedValues', () => {
  it('should return an emtpy array when no match found', () => {
    expect(markdownEscapedValues(null, '(...)')).toEqual([]);
    expect(markdownEscapedValues('', '(...)')).toEqual([]);
    expect(markdownEscapedValues('Unmatched text', '(...)')).toEqual([]);
  });

  it('should extract found matches, even in nested configurations', () => {
    expect(markdownEscapedValues('This is a (match)', '(...)')).toEqual(['match']);

    expect(markdownEscapedValues('This should also (match(as(nested(parenthesis),with more data)))', '(...)'))
    .toEqual(['match(as(nested(parenthesis),with more data))']);
  });

  it('should extract matches with custom escape code only, and avoid other type of escapes that may use similar patters', () => {
    expect(markdownEscapedValues('This {should}(not match), this is a {a}(match), this other [a](should not)', '(...)', '{a}'))
    .toEqual(['match']);

    expect(markdownEscapedValues('This {should}(not match), this is a {a}(should(match)), this other {a}(too)', '(...)', '{a}'))
    .toEqual(['should(match)', 'too']);
  });
});
