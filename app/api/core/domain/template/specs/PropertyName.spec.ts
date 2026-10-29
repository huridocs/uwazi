import { PropertyName } from '../PropertyName.js';

describe('PropertyName', () => {
  it('should keep letters outside the replaced set', () => {
    expect(PropertyName.fromLabel(' my prop ').value).toBe('my_prop');
    expect(PropertyName.fromLabel('my^Foreïgn$próp"').value).toBe('my_foreïgn$próp_');
  });

  // prettier-ignore
  const invalidChars = [
    '~', '[', ']', '{', '}', ')', '(', '+',
    '^', '&', '-', '>', '<', '!', '?', '#',
    '\\', '/', '*', '?', '"', '<', '>', '=',
    '|', ':', '.', '[', ']', '%',
  ];

  it.each(invalidChars)(
    'should not contain the character %s and should be lowercase and trim whitespaces',
    char => {
      expect(PropertyName.fromLabel(` TE${char}ST${char}`).value).toBe('te_st_');
    }
  );

  it.each(['.', '_', '-', '+', '$'])('should not start with %s', char => {
    expect(PropertyName.fromLabel(`${char}test`).value).toBe('test');
  });
});
