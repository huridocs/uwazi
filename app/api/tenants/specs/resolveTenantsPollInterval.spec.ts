import { resolveTenantsPollInterval } from '#api/config.js';

describe('resolveTenantsPollInterval', () => {
  it('should default to 10 seconds', () => {
    expect(resolveTenantsPollInterval(undefined)).toBe(10);
  });

  it.each([
    ['30', 30],
    ['0.5', 0.5],
  ])('should accept %s', (value, seconds) => {
    expect(resolveTenantsPollInterval(value)).toBe(seconds);
  });

  it.each(['0', '-1', 'abc', ''])('should reject %j', value => {
    expect(() => resolveTenantsPollInterval(value)).toThrow(
      `TENANTS_POLL_INTERVAL_SECONDS must be a positive number of seconds, got "${value}"`
    );
  });
});
