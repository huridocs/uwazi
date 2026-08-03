import { User, UserRole } from '../User.js';
import { Credentials } from '../Credentials.js';
import { EncryptedPassword } from '../EncryptedPassword.js';

describe('User', () => {
  it('should leave credentials undefined when not provided', () => {
    const user = new User({
      _id: 'user1',
      username: 'user1',
      role: UserRole.EDITOR,
      email: 'user1@example.com',
    });

    expect(user.credentials).toBeUndefined();
  });

  it('should carry credentials when provided', () => {
    const credentials = new Credentials({ password: EncryptedPassword.fromHash('hashed-value') });

    const user = new User({
      _id: 'user1',
      username: 'user1',
      role: UserRole.EDITOR,
      email: 'user1@example.com',
      credentials,
    });

    expect(user.credentials).toBe(credentials);
  });

  describe('setPassword()', () => {
    it('should create Credentials when none exist yet', () => {
      const user = new User({
        _id: 'user1',
        username: 'user1',
        role: UserRole.EDITOR,
        email: 'user1@example.com',
      });

      user.setPassword(EncryptedPassword.fromHash('hashed-value'));

      expect(user.credentials?.password.getValue()).toBe('hashed-value');
    });

    it('should replace only the password, preserving other Credentials fields', () => {
      const credentials = new Credentials({
        password: EncryptedPassword.fromHash('old-hash'),
        failedLogins: 3,
        accountLocked: true,
        using2fa: true,
      });

      const user = new User({
        _id: 'user1',
        username: 'user1',
        role: UserRole.EDITOR,
        email: 'user1@example.com',
        credentials,
      });

      user.setPassword(EncryptedPassword.fromHash('new-hash'));

      expect(user.credentials?.password.getValue()).toBe('new-hash');
      expect(user.credentials?.failedLogins).toBe(3);
      expect(user.credentials?.accountLocked).toBe(true);
      expect(user.credentials?.using2fa).toBe(true);
    });
  });
});
