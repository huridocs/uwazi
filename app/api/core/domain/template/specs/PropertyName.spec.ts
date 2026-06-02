import { PropertyName } from '../PropertyName.js';

describe('PropertyName', () => {
  describe('old name generation', () => {
    it('should produce strict safe names', () => {
      const results = [
        PropertyName.fromLabel(' my prop ').value,
        PropertyName.fromLabel('my^Foreïgn$próp"').value,
      ];

      expect(results[0]).toBe('my_prop');
      expect(results[1]).toBe('my_fore_gn_pr_p_');
    });

    describe('new name generation', () => {
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
          expect(
            PropertyName.fromLabel(` TE${char}ST${char}`, { newNameGeneration: true }).value
          ).toBe('te_st_');
        }
      );

      it.each(['.', '_', '-', '+', '$'])('should not start with %s', char => {
        expect(PropertyName.fromLabel(`${char}test`, { newNameGeneration: true }).value).toBe(
          'test'
        );
      });
    });
  });
});
