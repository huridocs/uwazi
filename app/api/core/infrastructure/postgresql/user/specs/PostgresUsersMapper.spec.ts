import { PostgresUsersMapper } from '../PostgresUsersMapper.js';
import { User, UserRole } from '#api/core/domain/user/User.js';
import { UserAccount } from '#api/core/domain/user/UserAccount.js';
import { Credentials } from '#api/core/domain/user/Credentials.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import type { UserRow } from '../PostgresUserRow.js';

describe('PostgresUsersMapper', () => {
  describe('toRow', () => {
    it('should exclude credential fields when the user is not a UserAccount', () => {
      const user = new User({
        _id: 'user-1',
        username: 'testuser',
        role: UserRole.ADMIN,
        email: 'test@example.com',
      });

      const result = PostgresUsersMapper.toRow(user);

      expect(result).toEqual({
        _id: 'user-1',
        username: 'testuser',
        role: 'admin',
        email: 'test@example.com',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should include password hash and credentials fields for a UserAccount', () => {
      const user = new UserAccount({
        _id: 'user-1',
        username: 'testuser',
        role: UserRole.ADMIN,
        email: 'test@example.com',
        credentials: new Credentials({
          password: EncryptedPassword.fromHash('$2a$10$hashedvalue'),
        }),
      });

      const result = PostgresUsersMapper.toRow(user);

      expect(result.password).toBe('$2a$10$hashedvalue');
    });

    it('should map a cleared unlock code to explicit null, not omit the key', () => {
      const user = new UserAccount({
        _id: 'user-1',
        username: 'testuser',
        role: UserRole.ADMIN,
        email: 'test@example.com',
        credentials: new Credentials({
          password: EncryptedPassword.fromHash('$2a$10$hashedvalue'),
        })
          .withLock('unlock-code')
          .withClearedLockout(),
      });

      const result = PostgresUsersMapper.toRow(user);

      expect(result).toHaveProperty('accountUnlockCode', null);
    });
  });

  describe('toDomain', () => {
    it('should map identity fields', () => {
      const row: UserRow = {
        _id: 'user-1',
        username: 'testuser',
        role: UserRole.ADMIN,
        email: 'test@example.com',
      };

      const result = PostgresUsersMapper.toDomain(row);

      expect(result._id).toBe('user-1');
      expect(result.username).toBe('testuser');
      expect(result.role).toBe('admin');
      expect(result.email).toBe('test@example.com');
    });

    it('should not be a UserAccount, even when the row carries credential fields', () => {
      const row: UserRow = {
        _id: 'user-1',
        username: 'testuser',
        role: UserRole.ADMIN,
        email: 'test@example.com',
        password: '$2a$10$hashedvalue',
      };

      const result = PostgresUsersMapper.toDomain(row);

      expect(result).not.toBeInstanceOf(UserAccount);
    });
  });

  describe('toAccountDomain', () => {
    it('should hydrate credentials from the row', () => {
      const row: UserRow = {
        _id: 'user-1',
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

      const result = PostgresUsersMapper.toAccountDomain(row);

      expect(result.credentials.password.getValue()).toBe('$2a$10$hashedvalue');
      expect(result.credentials.failedLogins).toBe(2);
      expect(result.credentials.accountLocked).toBe(true);
      expect(result.credentials.accountUnlockCode).toBe('unlock-code');
      expect(result.credentials.using2fa).toBe(true);
      expect(result.credentials.secret).toBe('a-secret');
    });

    it('should map a null unlock code to undefined', () => {
      const row: UserRow = {
        _id: 'user-1',
        username: 'testuser',
        role: UserRole.ADMIN,
        email: 'test@example.com',
        password: '$2a$10$hashedvalue',
        accountUnlockCode: null,
        using2fa: false,
      };

      const result = PostgresUsersMapper.toAccountDomain(row);

      expect(result.credentials.accountUnlockCode).toBeUndefined();
    });
  });
});
