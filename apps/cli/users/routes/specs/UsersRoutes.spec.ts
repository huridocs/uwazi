import { ZodError } from 'zod';
import { UsersRoutes } from '../../UsersRoutes.js';

const route = (name: string) => {
  const found = UsersRoutes.all().find(r => r.name === name);
  if (!found) throw new Error(`no users ${name} route`);
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

describe('UsersRoutes', () => {
  it('should register the users commands with their tenancy', () => {
    expect(UsersRoutes.all().map(r => [`${r.group} ${r.name}`, r.tenancy])).toEqual([
      ['users create', 'single'],
      ['users update', 'single'],
      ['users delete', 'single'],
      ['users list', 'single-or-all'],
      ['users stats', 'single-or-all'],
    ]);
  });

  it('should only need MongoDB and PostgreSQL, never Redis', () => {
    UsersRoutes.all().forEach(r => expect(r.needs).toEqual({ redis: false }));
  });

  it.each(['create', 'update', 'delete', 'list', 'stats'])(
    '%s should reject unknown request fields, tenant included',
    name => {
      expect(issuesOf(() => parse(name, { tenant: 'acme', username: 'bob' }))).toContain('');
    }
  );

  describe('create', () => {
    it('should take the request as input, with welcome email and groups defaulted', () => {
      expect(parse('create', { username: 'bob', email: 'bob@x.org', role: 'editor' })).toEqual({
        username: 'bob',
        email: 'bob@x.org',
        role: 'editor',
        groups: [],
        welcomeEmail: true,
      });
    });

    it('should honour welcomeEmail and groups', () => {
      expect(
        parse('create', {
          username: 'bob',
          email: 'bob@x.org',
          role: 'editor',
          groups: ['g1', 'g2'],
          welcomeEmail: false,
        })
      ).toMatchObject({ groups: ['g1', 'g2'], welcomeEmail: false });
    });

    it('should require username, email and a known role', () => {
      expect(issuesOf(() => parse('create', { role: 'boss' }))).toEqual([
        'username',
        'email',
        'role',
      ]);
    });

    it('should report domain errors on assigned groups under groups', () => {
      expect(route('create').fieldMap).toEqual({ assignedGroupIds: 'groups' });
    });
  });

  describe.each(['update', 'delete'])('%s', name => {
    it('should accept username', () => {
      expect(parse(name, { username: 'bob' })).toMatchObject({ username: 'bob' });
    });

    it('should accept id when it is a 24-character hex id', () => {
      const id = 'aaaaaaaaaaaaaaaaaaaaaaaa';
      expect(parse(name, { id })).toMatchObject({ id });
      expect(issuesOf(() => parse(name, { id: 'nope' }))).toEqual(['id']);
    });

    it.each([
      ['neither username nor id', {}],
      ['both username and id', { username: 'bob', id: 'aaaaaaaaaaaaaaaaaaaaaaaa' }],
    ])('should reject %s', (_case, reference) => {
      expect(issuesOf(() => parse(name, reference))).toEqual(['user']);
    });
  });

  describe('update', () => {
    it('should take the changes, leaving absent ones undefined', () => {
      expect(parse('update', { username: 'bob', newUsername: 'robert', email: 'r@x.org' })).toEqual(
        { username: 'bob', newUsername: 'robert', email: 'r@x.org' }
      );
    });

    it('should report domain errors on the new username under newUsername', () => {
      expect(route('update').fieldMap).toEqual({
        username: 'newUsername',
        assignedGroupIds: 'groups',
      });
    });
  });

  describe('list', () => {
    it('should accept a known role filter only', () => {
      expect(parse('list', { role: 'admin' })).toEqual({ role: 'admin' });
      expect(issuesOf(() => parse('list', { role: 'boss' }))).toEqual(['role']);
    });
  });

  describe('stats', () => {
    it('should take an empty request', () => {
      expect(parse('stats', {})).toEqual({});
    });
  });
});
