import { safeName } from '../propertyNames';

describe('propertyNames (shared)', () => {
  describe('safeName', () => {
    it('should sanitize the label', () => {
      const results = [safeName(' my prop '), safeName('my^Foreïgn$próp"')];

      expect(results[0]).toBe('my_prop');
      expect(results[1]).toBe('my_fore_gn_pr_p_');
    });

    describe('less restrictive name generation', () => {
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
          expect(safeName(` TE${char}ST${char}`, true)).toBe('te_st_');
        }
      );

      it.each(['.', '_', '-', '+', '$'])('should not start with %s', char => {
        expect(safeName(`${char}test`, true)).toBe('test');
      });
    });
  });
});
