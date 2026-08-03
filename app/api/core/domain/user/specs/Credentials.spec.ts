import { Credentials, MAX_FAILED_LOGIN_ATTEMPTS } from '../Credentials.js';
import { EncryptedPassword } from '../EncryptedPassword.js';

const password = EncryptedPassword.fromHash('hashed-value');

describe('Credentials', () => {
  it('should default failedLogins, accountLocked and using2fa when not provided', () => {
    const credentials = new Credentials({ password });

    expect(credentials.failedLogins).toBe(0);
    expect(credentials.accountLocked).toBe(false);
    expect(credentials.using2fa).toBe(false);
    expect(credentials.isLocked()).toBe(false);
    expect(credentials.requiresTwoFactor()).toBe(false);
  });

  describe('withIncrementedFailedLogins()', () => {
    it('should return a new instance with failedLogins incremented, leaving the original untouched', () => {
      const credentials = new Credentials({ password, failedLogins: 1 });

      const updated = credentials.withIncrementedFailedLogins();

      expect(updated).not.toBe(credentials);
      expect(updated.failedLogins).toBe(2);
      expect(credentials.failedLogins).toBe(1);
    });

    it('should report shouldLock() once the threshold is reached', () => {
      let credentials = new Credentials({ password, failedLogins: MAX_FAILED_LOGIN_ATTEMPTS - 2 });

      expect(credentials.shouldLock()).toBe(false);

      credentials = credentials.withIncrementedFailedLogins();
      expect(credentials.shouldLock()).toBe(false);

      credentials = credentials.withIncrementedFailedLogins();
      expect(credentials.shouldLock()).toBe(true);
    });
  });

  describe('withLock()', () => {
    it('should return a new locked instance carrying the unlock code', () => {
      const credentials = new Credentials({ password, failedLogins: MAX_FAILED_LOGIN_ATTEMPTS });

      const locked = credentials.withLock('unlock-code');

      expect(locked).not.toBe(credentials);
      expect(locked.isLocked()).toBe(true);
      expect(locked.accountUnlockCode).toBe('unlock-code');
      expect(credentials.isLocked()).toBe(false);
    });
  });

  describe('withClearedLockout()', () => {
    it('should reset failedLogins, accountLocked and accountUnlockCode', () => {
      const credentials = new Credentials({
        password,
        failedLogins: MAX_FAILED_LOGIN_ATTEMPTS,
        accountLocked: true,
        accountUnlockCode: 'unlock-code',
      });

      const cleared = credentials.withClearedLockout();

      expect(cleared.failedLogins).toBe(0);
      expect(cleared.isLocked()).toBe(false);
      expect(cleared.accountUnlockCode).toBeUndefined();
    });
  });

  describe('requiresTwoFactor()', () => {
    it('should reflect the using2fa flag', () => {
      const credentials = new Credentials({ password, using2fa: true, secret: 'a-secret' });

      expect(credentials.requiresTwoFactor()).toBe(true);
      expect(credentials.secret).toBe('a-secret');
    });
  });
});
