import { ObjectId } from 'mongodb';
import { MongoUsersMapper } from '../MongoUsersMapper.js';
import { User, UserRole } from '#api/core/domain/user/User.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import type { UserDBO } from '../UserDBO.js';

describe('MongoUsersMapper', () => {
  describe('toDBO', () => {
    it('should exclude password when user.credentials is undefined', () => {
      const user = new User({
        _id: '507f191e810c19729de860ea',
        username: 'testuser',
        role: UserRole.ADMIN,
        email: 'test@example.com',
      });

      const result = MongoUsersMapper.toDBO(user);

      expect(result).toEqual({
        _id: new ObjectId('507f191e810c19729de860ea'),
        username: 'testuser',
        role: 'admin',
        email: 'test@example.com',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should include password hash from user.credentials when set', () => {
      const user = new User({
        _id: '507f191e810c19729de860ea',
        username: 'testuser',
        role: UserRole.ADMIN,
        email: 'test@example.com',
      });

      user.setPassword(EncryptedPassword.fromHash('$2a$10$hashedvalue'));

      const result = MongoUsersMapper.toDBO(user);

      expect(result.password).toBe('$2a$10$hashedvalue');
    });
  });

  describe('toDomain', () => {
    it('should map identity fields', () => {
      const dbo: UserDBO = {
        _id: new ObjectId('507f191e810c19729de860ea'),
        username: 'testuser',
        role: UserRole.ADMIN,
        email: 'test@example.com',
      };

      const result = MongoUsersMapper.toDomain(dbo);

      expect(result._id).toBe('507f191e810c19729de860ea');
      expect(result.username).toBe('testuser');
      expect(result.role).toBe('admin');
      expect(result.email).toBe('test@example.com');
    });

    it('should not hydrate credentials when dbo.password is absent (e.g. excluded by projection)', () => {
      const dbo: UserDBO = {
        _id: new ObjectId('507f191e810c19729de860ea'),
        username: 'testuser',
        role: UserRole.ADMIN,
        email: 'test@example.com',
      };

      const result = MongoUsersMapper.toDomain(dbo);

      expect(result.credentials).toBeUndefined();
    });

    it('should hydrate credentials whenever dbo.password is present', () => {
      const dbo: UserDBO = {
        _id: new ObjectId('507f191e810c19729de860ea'),
        username: 'testuser',
        role: UserRole.ADMIN,
        email: 'test@example.com',
        password: '$2a$10$hashedvalue',
        failedLogins: 2,
        accountLocked: true,
        accountUnlockCode: 'unlock-code',
        using2fa: true,
        secret: 'a-secret',
      };

      const result = MongoUsersMapper.toDomain(dbo);

      expect(result.credentials?.password.getValue()).toBe('$2a$10$hashedvalue');
      expect(result.credentials?.failedLogins).toBe(2);
      expect(result.credentials?.accountLocked).toBe(true);
      expect(result.credentials?.accountUnlockCode).toBe('unlock-code');
      expect(result.credentials?.using2fa).toBe(true);
      expect(result.credentials?.secret).toBe('a-secret');
    });
  });
});
