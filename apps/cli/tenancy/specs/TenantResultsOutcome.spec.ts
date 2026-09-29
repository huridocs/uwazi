import { ExitCode } from '../../errors/ExitCode.js';
import { TenantResultsOutcome } from '../TenantResultsOutcome.js';

describe('TenantResultsOutcome', () => {
  describe('is()', () => {
    it('should recognise a per-tenant result only', () => {
      expect(TenantResultsOutcome.is({ results: [], errors: [] })).toBe(true);
      expect(TenantResultsOutcome.is({ results: [] })).toBe(false);
      expect(TenantResultsOutcome.is([])).toBe(false);
      expect(TenantResultsOutcome.is(null)).toBe(false);
    });
  });

  describe('exitCode()', () => {
    it('should be Ok when no tenant failed', () => {
      expect(TenantResultsOutcome.exitCode({ results: [], errors: [] })).toBe(ExitCode.Ok);
    });

    it('should follow the first failure category otherwise', () => {
      expect(
        TenantResultsOutcome.exitCode({
          results: [],
          errors: [{ tenant: 'a', error: { code: 'x', category: 'not_found', message: 'm' } }],
        })
      ).toBe(ExitCode.NotFound);
    });
  });
});
