import { ZodError } from 'zod';
import { TenantsRoutes } from '../../TenantsRoutes.js';

const route = (name: string) => {
  const found = TenantsRoutes.all().find(r => r.command[r.command.length - 1] === name);
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
  it('should register every tenants command with its tenancy', () => {
    expect(TenantsRoutes.all().map(r => [r.command.join(' '), r.tenancy])).toEqual([
      ['tenants list', 'none'],
      ['tenants get', 'none'],
      ['tenants archive', 'none'],
      ['tenants unarchive', 'none'],
      ['tenants register', 'none'],
      ['tenants update', 'none'],
      ['tenants delete', 'none'],
      ['tenants feature-flags', 'none'],
      ['tenants maintenance', 'none'],
      ['tenants stats', 'none'],
      ['tenants health-check', 'none'],
    ]);
  });

  it('should never need Redis, the session store or the admin pool', () => {
    TenantsRoutes.all().forEach(r => expect(r.needs).toEqual({ redis: false, sessions: false }));
  });

  describe('list', () => {
    it('should take an empty request only', () => {
      expect(parse('list', {})).toEqual({});
      expect(issuesOf(() => parse('list', { name: 'acme' }))).toEqual(['']);
    });

    it('should switch to the archived registry with --archived, never a request field', () => {
      const list = route('list');

      expect(issuesOf(() => parse('list', { archived: true }))).toEqual(['']);
      expect(list.options).toBeDefined();
      expect(list.input?.parse({ archived: false })).toEqual({ archived: false });
      expect(list.input?.parse({ archived: true })).toEqual({ archived: true });
      expect(list.requestFromFlags?.({ archived: false }, {})).toEqual({ archived: false });
      expect(list.requestFromFlags?.({ archived: true }, {})).toEqual({ archived: true });
    });
  });

  describe('get', () => {
    it('should take the tenant name in the request, not a flag', () => {
      expect(parse('get', { name: 'acme' })).toEqual({ name: 'acme' });
      expect(issuesOf(() => parse('get', {}))).toEqual(['name']);
    });
  });

  describe('archive', () => {
    it('should take a name and the dump location', () => {
      expect(
        parse('archive', {
          name: 'acme',
          dumpLocation: { db: 'https://s3/db.zip', files: 'https://store/acme' },
        })
      ).toEqual({
        name: 'acme',
        dumpLocation: { db: 'https://s3/db.zip', files: 'https://store/acme' },
      });
    });

    it('should require the name and both dump location fields', () => {
      expect(issuesOf(() => parse('archive', {}))).toEqual(['name', 'dumpLocation']);
      expect(issuesOf(() => parse('archive', { name: 'acme' }))).toEqual(['dumpLocation']);
      expect(issuesOf(() => parse('archive', { name: 'acme', dumpLocation: { db: 'x' } }))).toEqual(
        ['dumpLocation.files']
      );
      expect(
        issuesOf(() => parse('archive', { name: 'acme', dumpLocation: { files: 'y' } }))
      ).toEqual(['dumpLocation.db']);
    });

    it('should reject the archived flag and unknown fields', () => {
      expect(
        issuesOf(() =>
          parse('archive', { name: 'acme', dumpLocation: { db: 'x', files: 'y' }, archived: true })
        )
      ).toEqual(['']);
      expect(
        issuesOf(() =>
          parse('archive', { name: 'acme', dumpLocation: { db: 'x', files: 'y', extra: 'z' } })
        )
      ).toEqual(['dumpLocation']);
    });
  });

  describe('unarchive', () => {
    it('should take the tenant name in the request', () => {
      expect(parse('unarchive', { name: 'acme' })).toEqual({ name: 'acme' });
      expect(issuesOf(() => parse('unarchive', {}))).toEqual(['name']);
    });

    it('should reject the archived flag', () => {
      expect(issuesOf(() => parse('unarchive', { name: 'acme', archived: true }))).toEqual(['']);
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
