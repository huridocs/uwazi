import { ObjectId } from 'mongodb';
import { MongoUsersMapper } from '../MongoUsersMapper.js';
import { User } from '#api/core/domain/user/User.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import type { UserDBO } from '../UserDBO.js';

describe('MongoUsersMapper', () => {
  describe('toDBO', () => {
    it('should exclude password when user.password is undefined', () => {
      const user = new User({
        _id: '507f191e810c19729de860ea',
        username: 'testuser',
        role: 'admin',
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

    it('should include password as null when user.password is null', () => {
      const user = new User({
        _id: '507f191e810c19729de860ea',
        username: 'testuser',
        role: 'admin',
        email: 'test@example.com',
      });

      user.password = null;

      const result = MongoUsersMapper.toDBO(user);

      expect(result.password).toBeNull();
    });

    it('should include password hash when user.password is set', () => {
      const user = new User({
        _id: '507f191e810c19729de860ea',
        username: 'testuser',
        role: 'admin',
        email: 'test@example.com',
      });
      user.setPassword(EncryptedPassword.fromHash('$2a$10$hashedvalue'));

      const result = MongoUsersMapper.toDBO(user);

      expect(result.password).toBe('$2a$10$hashedvalue');
    });
  });

  describe('toDomain', () => {
    it('should map all fields and set password when it is present', () => {
      const dbo: UserDBO = {
        _id: new ObjectId('507f191e810c19729de860ea'),
        username: 'testuser',
        role: 'admin',
        email: 'test@example.com',
        password: '$2a$10$hashedvalue',
      };

      const result = MongoUsersMapper.toDomain(dbo);

      expect(result._id).toBe('507f191e810c19729de860ea');
      expect(result.username).toBe('testuser');
      expect(result.role).toBe('admin');
      expect(result.email).toBe('test@example.com');
      expect(result.password?.getValue()).toBe('$2a$10$hashedvalue');
    });

    it('should not set password when dbo.password is undefined', () => {
      const dbo: UserDBO = {
        _id: new ObjectId('507f191e810c19729de860ea'),
        username: 'testuser',
        role: 'admin',
        email: 'test@example.com',
      };

      const result = MongoUsersMapper.toDomain(dbo);

      expect(result.password).toBeUndefined();
    });

    it('should not set password when dbo.password is null', () => {
      const dbo: UserDBO = {
        _id: new ObjectId('507f191e810c19729de860ea'),
        username: 'testuser',
        role: 'admin',
        email: 'test@example.com',
        password: null,
      };

      const result = MongoUsersMapper.toDomain(dbo);

      expect(result.password).toBeUndefined();
    });
  });
});
