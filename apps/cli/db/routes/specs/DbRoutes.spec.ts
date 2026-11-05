import { ZodError } from 'zod';
import { DbRoutes } from '../../DbRoutes.js';

const route = (name: string) => {
  const found = DbRoutes.all().find(r => r.command[r.command.length - 1] === name);
  if (!found) throw new Error(`no db ${name} route`);
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

describe('DbRoutes', () => {
  it('should register the db commands with their tenancy', () => {
    expect(DbRoutes.all().map(r => [r.command.join(' '), r.tenancy])).toEqual([
      ['db clear', 'single'],
      ['db export', 'single'],
      ['db import', 'single'],
      ['db upgrade', 'none'],
      ['db blank-state dump', 'single'],
      ['db blank-state restore', 'single'],
    ]);
  });

  it('should need the admin Postgres pool and never Redis or sessions', () => {
    DbRoutes.all()
      .filter(r => r.command[r.command.length - 1] !== 'upgrade')
      .forEach(r =>
        expect(r.needs).toEqual({ redis: false, sessions: false, postgresAdmin: true })
      );
  });

  it('should also need a scratch database to upgrade a backup', () => {
    expect(route('upgrade').needs).toEqual({
      redis: false,
      sessions: false,
      postgresAdmin: true,
      scratchDatabase: true,
    });
  });

  describe('clear', () => {
    it('should take an empty request only', () => {
      expect(parse('clear', {})).toEqual({});
      expect(issuesOf(() => parse('clear', { name: 'acme' }))).toEqual(['']);
    });
  });

  describe('export', () => {
    it('should take an empty request only', () => {
      expect(parse('export', {})).toEqual({});
      expect(issuesOf(() => parse('export', { name: 'acme' }))).toEqual(['']);
    });
  });

  describe('import', () => {
    it('should take clear and nullSync, leaving them undefined when absent', () => {
      expect(parse('import', {})).toEqual({});
      expect(parse('import', { clear: true })).toEqual({ clear: true });
      expect(parse('import', { nullSync: true })).toEqual({ nullSync: true });
    });

    it('should reject non-boolean clear and nullSync', () => {
      expect(issuesOf(() => parse('import', { clear: 'yes' }))).toEqual(['clear']);
      expect(issuesOf(() => parse('import', { nullSync: 'yes' }))).toEqual(['nullSync']);
    });

    it('should expose clear and null-sync as flags merged into the request', () => {
      const importRoute = route('import');
      const merge = importRoute.requestFromFlags;
      if (!merge) throw new Error('import should merge flags into its request');

      expect(importRoute.request.parse(merge({ clear: true }, {}))).toEqual({ clear: true });
      expect(importRoute.request.parse(merge({ 'null-sync': true }, {}))).toEqual({
        nullSync: true,
      });
      expect(importRoute.request.parse(merge({ clear: false, 'null-sync': false }, {}))).toEqual(
        {}
      );
      expect(importRoute.options).toBeDefined();
    });
  });

  describe('upgrade', () => {
    it('should require input and output, with force optional', () => {
      expect(parse('upgrade', { input: 'a.uwazidump', output: 'b.uwazidump' })).toEqual({
        input: 'a.uwazidump',
        output: 'b.uwazidump',
      });
      expect(issuesOf(() => parse('upgrade', {})).sort()).toEqual(['input', 'output']);
      expect(issuesOf(() => parse('upgrade', { input: 'a', output: 'b', force: 'yes' }))).toEqual([
        'force',
      ]);
    });

    it('should take input, output and force as flags merged into the request', () => {
      const upgradeRoute = route('upgrade');
      const merge = upgradeRoute.requestFromFlags;
      if (!merge) throw new Error('upgrade should merge flags into its request');

      expect(
        upgradeRoute.request.parse(merge({ input: 'a', output: 'b', force: true }, {}))
      ).toEqual({ input: 'a', output: 'b', force: true });
      expect(
        upgradeRoute.request.parse(merge({ input: 'a', output: 'b', force: false }, {}))
      ).toEqual({ input: 'a', output: 'b' });
      expect(upgradeRoute.options).toBeDefined();
    });
  });
});
