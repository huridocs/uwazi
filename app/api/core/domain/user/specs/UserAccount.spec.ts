import { UserRole } from '../User.js';
import { UserAccount } from '../UserAccount.js';
import { Credentials } from '../Credentials.js';
import { EncryptedPassword } from '../EncryptedPassword.js';

describe('UserAccount', () => {
  it('should carry the credentials it was created with', () => {
    const credentials = new Credentials({ password: EncryptedPassword.fromHash('hashed-value') });

    const account = new UserAccount({
      _id: 'user1',
      username: 'user1',
      role: UserRole.EDITOR,
      email: 'user1@example.com',
      credentials,
    });

    expect(account.credentials).toBe(credentials);
  });

  describe('setPassword()', () => {
    it('should replace only the password, preserving other Credentials fields', () => {
      const credentials = new Credentials({
        password: EncryptedPassword.fromHash('old-hash'),
        failedLogins: 3,
        accountLocked: true,
        using2fa: true,
      });

      const account = new UserAccount({
        _id: 'user1',
        username: 'user1',
        role: UserRole.EDITOR,
        email: 'user1@example.com',
        credentials,
      });

      account.setPassword(EncryptedPassword.fromHash('new-hash'));

      expect(account.credentials.password.getValue()).toBe('new-hash');
      expect(account.credentials.failedLogins).toBe(3);
      expect(account.credentials.accountLocked).toBe(true);
      expect(account.credentials.using2fa).toBe(true);
    });
  });

  describe('incrementFailedLogins()', () => {
    it('should delegate to Credentials.withIncrementedFailedLogins()', () => {
      const credentials = new Credentials({
        password: EncryptedPassword.fromHash('hash'),
        failedLogins: 1,
      });
      const account = new UserAccount({
        _id: 'user1',
        username: 'user1',
        role: UserRole.EDITOR,
        email: 'user1@example.com',
        credentials,
      });

      account.incrementFailedLogins();

      expect(account.credentials.failedLogins).toBe(2);
    });
  });

  describe('lock()', () => {
    it('should delegate to Credentials.withLock()', () => {
      const credentials = new Credentials({ password: EncryptedPassword.fromHash('hash') });
      const account = new UserAccount({
        _id: 'user1',
        username: 'user1',
        role: UserRole.EDITOR,
        email: 'user1@example.com',
        credentials,
      });

      account.lock('unlock-code');

      expect(account.credentials.isLocked()).toBe(true);
      expect(account.credentials.accountUnlockCode).toBe('unlock-code');
    });
  });

  describe('clearLockout()', () => {
    it('should delegate to Credentials.withClearedLockout()', () => {
      const credentials = new Credentials({
        password: EncryptedPassword.fromHash('hash'),
        failedLogins: 3,
        accountLocked: true,
        accountUnlockCode: 'unlock-code',
      });
      const account = new UserAccount({
        _id: 'user1',
        username: 'user1',
        role: UserRole.EDITOR,
        email: 'user1@example.com',
        credentials,
      });

      account.clearLockout();

      expect(account.credentials.failedLogins).toBe(0);
      expect(account.credentials.isLocked()).toBe(false);
      expect(account.credentials.accountUnlockCode).toBeUndefined();
    });
  });
});
