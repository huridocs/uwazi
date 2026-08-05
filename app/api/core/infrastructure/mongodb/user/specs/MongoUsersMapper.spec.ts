import { ObjectId } from 'mongodb';
import { MongoUsersMapper } from '../MongoUsersMapper.js';
import { User, UserRole } from '#api/core/domain/user/User.js';
import { UserAccount } from '#api/core/domain/user/UserAccount.js';
import { Credentials } from '#api/core/domain/user/Credentials.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import type { UserDBO } from '../UserDBO.js';

describe('MongoUsersMapper', () => {
  describe('toDBO', () => {
    it('should exclude password when the user is not a UserAccount', () => {
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

    it('should include password hash and credentials fields for a UserAccount', () => {
      const user = new UserAccount({
        _id: '507f191e810c19729de860ea',
        username: 'testuser',
        role: UserRole.ADMIN,
        email: 'test@example.com',
        credentials: new Credentials({
          password: EncryptedPassword.fromHash('$2a$10$hashedvalue'),
        }),
      });

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

    it('should not be a UserAccount, even when the dbo carries credential fields', () => {
      const dbo: UserDBO = {
        _id: new ObjectId('507f191e810c19729de860ea'),
        username: 'testuser',
        role: UserRole.ADMIN,
        email: 'test@example.com',
        password: '$2a$10$hashedvalue',
      };

      const result = MongoUsersMapper.toDomain(dbo);

      expect(result).not.toBeInstanceOf(UserAccount);
    });
  });

  describe('toAccountDomain', () => {
    it('should hydrate credentials from the dbo', () => {
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

      const result = MongoUsersMapper.toAccountDomain(dbo);

      expect(result.credentials.password.getValue()).toBe('$2a$10$hashedvalue');
      expect(result.credentials.failedLogins).toBe(2);
      expect(result.credentials.accountLocked).toBe(true);
      expect(result.credentials.accountUnlockCode).toBe('unlock-code');
      expect(result.credentials.using2fa).toBe(true);
      expect(result.credentials.secret).toBe('a-secret');
    });
  });
});
