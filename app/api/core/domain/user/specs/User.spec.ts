import { User, UserRole } from '../User.js';

describe('User', () => {
  describe('updateProfile()', () => {
    it('should replace username, role, email and groups', () => {
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
        groups: [{ _id: 'group1', name: 'Group 1' }],
      });

      expect(user.username).toBe('renamed');
      expect(user.role).toBe(UserRole.ADMIN);
      expect(user.email).toBe('renamed@example.com');
      expect(user.groups).toEqual([{ _id: 'group1', name: 'Group 1' }]);
    });

    it('should default groups to an empty array when not provided', () => {
      const user = new User({
        _id: 'user1',
        username: 'user1',
        role: UserRole.EDITOR,
        email: 'user1@example.com',
        groups: [{ _id: 'group1', name: 'Group 1' }],
      });

      user.updateProfile({
        username: 'user1',
        role: UserRole.EDITOR,
        email: 'user1@example.com',
      });

      expect(user.groups).toEqual([]);
    });
  });
});
