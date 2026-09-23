import { ZodError } from 'zod';
import { UsersRoutes } from '../../UsersRoutes.js';

const route = (name: string) => {
  const found = UsersRoutes.all().find(r => r.name === name);
  if (!found) throw new Error(`no users ${name} route`);
  return found;
};

/** What yargs hands a route: the parsed flags plus yargs' own keys. */
const argv = (args: Record<string, unknown>) => ({ _: ['users'], $0: 'uwazi', ...args });

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

  it('should leave tenant flags out of every input', () => {
    UsersRoutes.all().forEach(r => {
      expect(r.fieldMap).not.toHaveProperty('tenant');
    });
  });

  describe('create', () => {
    it('should map flags to input, with welcome email and groups defaulted', () => {
      expect(
        route('create').toInput(argv({ username: 'bob', email: 'bob@x.org', role: 'editor' }))
      ).toEqual({
        username: 'bob',
        email: 'bob@x.org',
        role: 'editor',
        groups: [],
        welcomeEmail: true,
      });
    });

    it('should honour --no-welcome-email and --groups', () => {
      expect(
        route('create').toInput(
          argv({
            username: 'bob',
            email: 'bob@x.org',
            role: 'editor',
            groups: ['g1', 'g2'],
            welcomeEmail: false,
          })
        )
      ).toMatchObject({ groups: ['g1', 'g2'], welcomeEmail: false });
    });

    it('should require username, email and a known role', () => {
      expect(issuesOf(() => route('create').toInput(argv({ role: 'boss' })))).toEqual([
        'username',
        'email',
        'role',
      ]);
    });

    it('should name the flags in validation errors', () => {
      expect(route('create').fieldMap).toMatchObject({
        username: '--username',
        email: '--email',
        role: '--role',
        assignedGroupIds: '--groups',
      });
    });
  });

  describe.each(['update', 'delete'])('%s', name => {
    it('should accept --username', () => {
      expect(route(name).toInput(argv({ username: 'bob' }))).toMatchObject({ username: 'bob' });
    });

    it('should accept --id when it is a 24-character hex id', () => {
      const id = 'aaaaaaaaaaaaaaaaaaaaaaaa';
      expect(route(name).toInput(argv({ id }))).toMatchObject({ id });
      expect(issuesOf(() => route(name).toInput(argv({ id: 'nope' })))).toEqual(['id']);
    });

    it.each([
      ['neither --username nor --id', {}],
      ['both --username and --id', { username: 'bob', id: 'aaaaaaaaaaaaaaaaaaaaaaaa' }],
    ])('should reject %s', (_case, reference) => {
      expect(issuesOf(() => route(name).toInput(argv(reference)))).toEqual(['user']);
    });

    it('should name the reference flags in validation errors', () => {
      expect(route(name).fieldMap.user).toBe('--username | --id');
    });
  });

  describe('update', () => {
    it('should map the change flags, leaving absent ones undefined', () => {
      expect(
        route('update').toInput(argv({ username: 'bob', newUsername: 'robert', email: 'r@x.org' }))
      ).toEqual({ username: 'bob', newUsername: 'robert', email: 'r@x.org' });
    });

    it('should report domain errors on the new username under --new-username', () => {
      expect(route('update').fieldMap.username).toBe('--new-username');
    });
  });

  describe('list', () => {
    it('should accept a known --role filter only', () => {
      expect(route('list').toInput(argv({ role: 'admin' }))).toEqual({ role: 'admin' });
      expect(issuesOf(() => route('list').toInput(argv({ role: 'boss' })))).toEqual(['role']);
    });
  });

  describe('stats', () => {
    it('should take no input of its own', () => {
      expect(route('stats').toInput(argv({ tenant: 'acme' }))).toEqual({});
    });
  });
});
