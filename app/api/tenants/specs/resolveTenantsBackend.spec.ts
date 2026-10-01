import { resolveTenantsBackend } from '#api/config.js';

describe('resolveTenantsBackend', () => {
  it('should default to mongo', () => {
    expect(resolveTenantsBackend(undefined)).toBe('mongo');
  });

  it.each(['mongo', 'postgres'] as const)('should accept %s', backend => {
    expect(resolveTenantsBackend(backend)).toBe(backend);
  });

  it('should reject an unknown backend', () => {
    expect(() => resolveTenantsBackend('redis')).toThrow(
      'TENANTS_BACKEND must be "mongo" or "postgres", got "redis"'
    );
  });
});
