import { ZodError } from 'zod';
import { TenantOptions } from '../TenantOptions.js';

const issuesOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    if (error instanceof ZodError) return error.issues.map(i => i.path.join('.'));
    throw error;
  }
  throw new Error('expected a ZodError');
};

describe('TenantOptions.parse()', () => {
  it('should select nothing for commands that are not tenant-scoped', () => {
    expect(TenantOptions.parse('none', { tenant: 'acme' })).toBeUndefined();
  });

  describe('single', () => {
    it('should select the given tenant', () => {
      expect(TenantOptions.parse('single', { tenant: 'acme' })).toEqual({
        tenant: 'acme',
        allTenants: false,
      });
    });

    it('should require --tenant', () => {
      expect(issuesOf(() => TenantOptions.parse('single', {}))).toEqual(['tenant']);
    });
  });

  describe('single-or-all', () => {
    it('should select one tenant', () => {
      expect(TenantOptions.parse('single-or-all', { tenant: 'acme', allTenants: false })).toEqual({
        tenant: 'acme',
        allTenants: false,
      });
    });

    it('should select every tenant', () => {
      expect(TenantOptions.parse('single-or-all', { allTenants: true })).toEqual({
        allTenants: true,
      });
    });

    it.each([
      ['neither', { allTenants: false }],
      ['both', { tenant: 'acme', allTenants: true }],
    ])('should reject %s of --tenant and --all-tenants', (_case, argv) => {
      expect(issuesOf(() => TenantOptions.parse('single-or-all', argv))).toEqual(['tenant']);
    });
  });

  it('should name both flags for error reporting', () => {
    expect(TenantOptions.fieldMap).toEqual({ tenant: '--tenant', allTenants: '--all-tenants' });
  });
});
