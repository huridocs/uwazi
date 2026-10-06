import { ZodError } from 'zod';
import { SettingsRoutes } from '../../SettingsRoutes.js';

const route = (name: string) => {
  const found = SettingsRoutes.all().find(r => r.name === name);
  if (!found) throw new Error(`no settings ${name} route`);
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

describe('SettingsRoutes', () => {
  it('should register the settings commands for a single tenant', () => {
    expect(SettingsRoutes.all().map(r => [`${r.group} ${r.name}`, r.tenancy])).toEqual([
      ['settings get', 'single'],
      ['settings update', 'single'],
    ]);
  });

  it('should only need MongoDB and PostgreSQL, never Redis', () => {
    SettingsRoutes.all().forEach(r => expect(r.needs).toEqual({ redis: false }));
  });

  describe('get', () => {
    it('should take an empty request only', () => {
      expect(parse('get', {})).toEqual({});
      expect(issuesOf(() => parse('get', { site_name: 'x' }))).toEqual(['']);
    });
  });

  describe('update', () => {
    it('should take a partial settings document', () => {
      expect(parse('update', { site_name: 'Uwazi', features: { favorites: true } })).toEqual({
        site_name: 'Uwazi',
        features: { favorites: true },
      });
    });

    it('should reject a field the settings schema does not know', () => {
      expect(issuesOf(() => parse('update', { unknownField: true }))).toEqual(['']);
    });
  });
});
