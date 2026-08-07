import { EncryptedPassword } from '../EncryptedPassword.js';

describe('EncryptedPassword', () => {
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
