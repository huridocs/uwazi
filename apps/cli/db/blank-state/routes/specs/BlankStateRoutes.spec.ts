import { ZodError } from 'zod';
import { BlankStateRoutes } from '../../BlankStateRoutes.js';

const route = (name: string) => {
  const found = BlankStateRoutes.all().find(r => r.command[r.command.length - 1] === name);
  if (!found) throw new Error(`no db blank-state ${name} route`);
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

describe('BlankStateRoutes', () => {
  it('should register the blank-state commands with their tenancy', () => {
    expect(BlankStateRoutes.all().map(r => [r.command.join(' '), r.tenancy])).toEqual([
      ['db blank-state dump', 'single'],
      ['db blank-state restore', 'single'],
    ]);
  });

  it('should need the admin Postgres pool and never Redis or sessions', () => {
    BlankStateRoutes.all().forEach(r =>
      expect(r.needs).toEqual({ redis: false, sessions: false, postgresAdmin: true })
    );
  });

  it.each(['dump', 'restore'])('%s should reject unknown request fields, tenant included', name => {
    expect(issuesOf(() => parse(name, { tenant: 'acme' }))).toContain('');
  });

  describe('dump', () => {
    it('should take an empty request', () => {
      expect(parse('dump', {})).toEqual({});
    });
  });

  describe('restore', () => {
    it('should take force, leaving it undefined when absent', () => {
      expect(parse('restore', {})).toEqual({});
      expect(parse('restore', { force: true })).toEqual({ force: true });
    });

    it('should reject a non-boolean force', () => {
      expect(issuesOf(() => parse('restore', { force: 'yes' }))).toEqual(['force']);
    });

    it('should expose force as a flag merged into the request', () => {
      const restore = route('restore');
      const merge = restore.requestFromFlags;
      if (!merge) throw new Error('restore should merge flags into its request');

      expect(restore.request.parse(merge({ force: true }, {}))).toEqual({ force: true });
      expect(restore.request.parse(merge({ force: false }, {}))).toEqual({});
      expect(restore.options).toBeDefined();
    });
  });
});
