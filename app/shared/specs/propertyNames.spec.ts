import { safeName } from '../propertyNames';

describe('propertyNames (shared)', () => {
  describe('safeName', () => {
    it('should sanitize the label', () => {
      const results = [safeName(' my prop '), safeName('my^Foreïgn$próp"')];

      expect(results[0]).toBe('my_prop');
      expect(results[1]).toBe('my_fore_gn_pr_p_');
    });

    describe('less restrictive name generation', () => {
      it('should not contain the characters #, \\, /, *, ?, ", <, >, |, , :, ., [, ], %, and should be lowercase', () => {
        const results = [
          safeName(' my prop ', true),
          safeName('my^foreïgn$próp"', true),
          safeName('TEST#', true),
          safeName('test\\', true),
          safeName('test/', true),
          safeName('*test*', true),
          safeName('test?', true),
          safeName('test"', true),
          safeName('test<', true),
          safeName('test>', true),
          safeName('test|', true),
          safeName('te st ', true),
          safeName('test: ', true),
          safeName('te.st. ', true),
          safeName('[brackets]', true),
          safeName('test%', true),
        ];

        expect(results).toEqual([
          'my_prop',
          'my^foreïgn$próp_',
          'test_',
          'test_',
          'test_',
          'test_',
          'test_',
          'test_',
          'test_',
          'test_',
          'test_',
          'te_st',
          'test_',
          'te_st_',
          'brackets_',
          'test_',
        ]);
      });

      it('should not start with _, -, +, $', () => {
        const results = [
          safeName('.test ', true),
          safeName('_test', true),
          safeName('+test', true),
          safeName('$test', true),
          safeName('-test', true),
        ];

        expect(results).toEqual(['test', 'test', 'test', 'test', 'test']);
      });
    });
  });
});
