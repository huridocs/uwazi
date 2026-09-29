import { ZodError } from 'zod';
import { User, UserProfilePatch, UserRole } from '../User.js';

const props = {
  _id: 'user1',
  username: 'user1',
  role: UserRole.EDITOR,
  email: 'user1@example.com',
};

const zodIssuePaths = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    if (error instanceof ZodError) return error.issues.map(issue => issue.path.join('.'));
    throw error;
  }
  throw new Error('expected a ZodError');
};

describe('User', () => {
  describe('create()', () => {
    it('should create a valid user, trimming the username', () => {
      const user = User.create({ ...props, username: '  user1  ' });

      expect(user).toBeInstanceOf(User);
      expect(user).toMatchObject({ ...props, username: 'user1' });
    });

    it.each([
      ['an empty username', { username: '   ' }, ['username']],
      ['a username with spaces', { username: 'user one' }, ['username']],
      ['an invalid email', { email: 'not-an-email' }, ['email']],
      ['an unknown role', { role: 'superuser' as UserRole }, ['role']],
    ])('should reject %s', (_case, overrides, paths) => {
      expect(zodIssuePaths(() => User.create({ ...props, ...overrides }))).toEqual(paths);
    });

    it('should report every invalid field at once', () => {
      expect(
        zodIssuePaths(() => User.create({ ...props, username: 'a b', email: 'nope' }))
      ).toEqual(['username', 'email']);
    });

    it('should keep the spaces message used by the API', () => {
      expect(() => User.create({ ...props, username: 'user one' })).toThrow(
        'Usernames can not contain spaces.'
      );
    });
  });

  describe('updateProfile()', () => {
    it('should replace username, role and email', () => {
      const user = new User(props);

      user.updateProfile({
        username: 'renamed',
        role: UserRole.ADMIN,
        email: 'renamed@example.com',
      });

      expect(user.username).toBe('renamed');
      expect(user.role).toBe(UserRole.ADMIN);
      expect(user.email).toBe('renamed@example.com');
    });

    it('should only touch the fields present in the patch', () => {
      const user = new User(props);

      user.updateProfile({ email: 'new@example.com' });

      expect(user).toMatchObject({ ...props, email: 'new@example.com' });
    });

    it('should treat undefined fields as untouched', () => {
      const user = new User(props);

      user.updateProfile({ username: undefined, email: 'new@example.com' });

      expect(user.username).toBe('user1');
    });

    it('should report which fields actually changed', () => {
      const user = new User(props);

      const { changed } = user.updateProfile({
        username: 'user1',
        email: 'new@example.com',
        role: UserRole.ADMIN,
      });

      expect(changed).toEqual(['email', 'role']);
    });

    it('should report no changes for an empty patch', () => {
      expect(new User(props).updateProfile({}).changed).toEqual([]);
    });

    it('should trim the username like create() does', () => {
      const user = new User(props);

      user.updateProfile({ username: '  renamed ' });

      expect(user.username).toBe('renamed');
    });

    it.each([
      ['null for a required field', { email: null } as unknown as UserProfilePatch, ['email']],
      ['an invalid email', { email: 'nope' }, ['email']],
      ['a username with spaces', { username: 'a b' }, ['username']],
    ])('should reject %s', (_case, patch, paths) => {
      expect(zodIssuePaths(() => new User(props).updateProfile(patch))).toEqual(paths);
    });

    it('should leave the user untouched when the patch is invalid', () => {
      const user = new User(props);

      expect(() => user.updateProfile({ email: 'new@example.com', username: 'a b' })).toThrow(
        ZodError
      );

      expect(user).toMatchObject(props);
    });
  });
});
