import { ZodError } from 'zod';
import { TenantsRoutes } from '../../TenantsRoutes.js';

const route = (name: string) => {
  const found = TenantsRoutes.all().find(r => r.name === name);
  if (!found) throw new Error(`no tenants ${name} route`);
  return found;
};

const parse = (name: string, request: unknown) => route(name).request.parse(request);

const issuesOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    if (error instanceof ZodError) return error.issues.map(i => i.path.join('.'));
    throw error;
  }
  throw new Error('expected a ZodError');
};

describe('TenantsRoutes', () => {
  it('should register every tenants command above tenant context', () => {
    expect(TenantsRoutes.all().map(r => [`${r.group} ${r.name}`, r.tenancy])).toEqual([
      ['tenants list', 'none'],
      ['tenants get', 'none'],
      ['tenants register', 'none'],
      ['tenants update', 'none'],
      ['tenants delete', 'none'],
      ['tenants feature-flags', 'none'],
      ['tenants maintenance', 'none'],
      ['tenants stats', 'none'],
      ['tenants health-check', 'none'],
    ]);
  });

  it('should only need MongoDB and PostgreSQL, never Redis', () => {
    TenantsRoutes.all().forEach(r =>
      expect(r.needs).toEqual({ redis: false, elasticsearch: false })
    );
  });

  describe('list', () => {
    it('should take an empty request only', () => {
      expect(parse('list', {})).toEqual({});
      expect(issuesOf(() => parse('list', { name: 'acme' }))).toEqual(['']);
    });
  });

  describe('get', () => {
    it('should take the tenant name in the request, not a flag', () => {
      expect(parse('get', { name: 'acme' })).toEqual({ name: 'acme' });
      expect(issuesOf(() => parse('get', {}))).toEqual(['name']);
    });
  });

  describe('register', () => {
    it('should take a name and the fields it may set', () => {
      expect(parse('register', { name: 'acme', domain: 'acme.uwazi.io' })).toEqual({
        name: 'acme',
        domain: 'acme.uwazi.io',
      });
    });

    it('should reject an unknown feature flag', () => {
      expect(issuesOf(() => parse('register', { name: 'acme', featureFlags: { nope: true } })));
    });
  });

  describe('update', () => {
    it('should accept null to remove a field', () => {
      expect(parse('update', { name: 'acme', domain: null })).toEqual({
        name: 'acme',
        domain: null,
      });
    });
  });

  describe('feature-flags', () => {
    it('should take the flags to merge', () => {
      expect(
        parse('feature-flags', { name: 'acme', featureFlags: { postgresCore: true } })
      ).toEqual({ name: 'acme', featureFlags: { postgresCore: true } });
    });

    it('should accept null to remove a flag', () => {
      expect(parse('feature-flags', { name: 'acme', featureFlags: { sync: null } })).toEqual({
        name: 'acme',
        featureFlags: { sync: null },
      });
    });
  });

  describe('maintenance', () => {
    it('should require the maintenance state', () => {
      expect(parse('maintenance', { name: 'acme', maintenance: true })).toEqual({
        name: 'acme',
        maintenance: true,
      });
      expect(issuesOf(() => parse('maintenance', { name: 'acme' }))).toEqual(['maintenance']);
    });
  });
});
