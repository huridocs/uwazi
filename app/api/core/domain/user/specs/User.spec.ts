import { User, UserRole } from '../User.js';

describe('User', () => {
  describe('updateProfile()', () => {
    it('should replace username, role and email', () => {
      const user = new User({
        _id: 'user1',
        username: 'user1',
        role: UserRole.EDITOR,
        email: 'user1@example.com',
      });

      user.updateProfile({
        username: 'renamed',
        role: UserRole.ADMIN,
        email: 'renamed@example.com',
      });

      expect(user.username).toBe('renamed');
      expect(user.role).toBe(UserRole.ADMIN);
      expect(user.email).toBe('renamed@example.com');
    });
  });
});
