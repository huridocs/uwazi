import { EncryptedPassword } from '../EncryptedPassword.js';

describe('EncryptedPassword', () => {
  describe('create()', () => {
    // v1's `newUser` did this with `random()` from #shared/uniqueID; the account is meant to
    // be unusable until the invitation link sets a real password.
    it('should generate an unguessable password when none is given', async () => {
      const password = await EncryptedPassword.create();

      await expect(password.compare('')).resolves.toBe(false);
      await expect(password.compare('undefined')).resolves.toBe(false);
      expect(password.getValue()).not.toBe('');
    });

    it('should generate a different password on every call', async () => {
      const [first, second] = [await EncryptedPassword.create(), await EncryptedPassword.create()];

      expect(first.getValue()).not.toBe(second.getValue());
    });
  });

  describe('compare()', () => {
    it('should return true when the plain value matches the hash', async () => {
      const password = await EncryptedPassword.create('correct-password');

      await expect(password.compare('correct-password')).resolves.toBe(true);
    });

    it('should return false when the plain value does not match the hash', async () => {
      const password = await EncryptedPassword.create('correct-password');

      await expect(password.compare('wrong-password')).resolves.toBe(false);
    });
  });
});
