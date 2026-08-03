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
});
