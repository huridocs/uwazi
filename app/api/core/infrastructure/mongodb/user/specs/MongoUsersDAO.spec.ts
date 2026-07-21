/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoUsersDAO } from '../MongoUsersDAO.js';
import { fixtures, factory, withsensitiveId } from './fixtures.js';

const getDao = () =>
  testingEnvironment.runWithContext(
    () =>
      new MongoUsersDAO({
        db: getConnection(),
        transactionManager: TransactionManagerFactory.default(),
      })
  );

describe('MongoUsersDAO', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('getById()', () => {
    it('should return a user without sensitive fields by default', async () => {
      const dao = getDao();
      const result = await dao.getById(factory.idString('active1'));

      expect(result.isOk()).toBe(true);
      const user = result.getDataOrThrow();
      expect(user.username).toBe('active1');
      expect(user.email).toBe('active1@test.com');
      expect(user.role).toBe('admin');
      expect(user.password).toBeUndefined();
      expect(user.secret).toBeUndefined();
      expect(user.failedLogins).toBeUndefined();
      expect(user.accountUnlockCode).toBeUndefined();
    });

    it('should include password when includePassword is true', async () => {
      const dao = getDao();
      const result = await dao.getById(factory.idString('active1'), {
        includePassword: true,
      });

      expect(result.isOk()).toBe(true);
      const user = result.getDataOrThrow();
      expect(user.password).toBeDefined();
      expect(user.secret).toBeUndefined();
      expect(user.failedLogins).toBeUndefined();
      expect(user.accountUnlockCode).toBeUndefined();
    });

    it('should include individual sensitive fields when requested', async () => {
      const dao = getDao();

      const result = await dao.getById(withsensitiveId.toString(), {
        includeSecret: true,
        includeFailedLogins: true,
      });

      expect(result.isOk()).toBe(true);
      const user = result.getDataOrThrow();
      expect(user.username).toBe('withsensitive');
      expect(user.secret).toBe('mysecret');
      expect(user.failedLogins).toBe(3);
      expect(user.password).toBeUndefined();
      expect(user.accountUnlockCode).toBeUndefined();
    });

    it('should return all fields when all sensitive flags are true', async () => {
      const dao = getDao();

      const result = await dao.getById(withsensitiveId.toString(), {
        includePassword: true,
        includeSecret: true,
        includeFailedLogins: true,
        includeAccountUnlockCode: true,
      });

      expect(result.isOk()).toBe(true);
      const user = result.getDataOrThrow();
      expect(user.password).toBe('hash');
      expect(user.secret).toBe('mysecret');
      expect(user.failedLogins).toBe(3);
      expect(user.accountUnlockCode).toBe('abc123');
      expect(user.accountLocked).toBe(false);
      expect(user.using2fa).toBe(true);
    });

    it('should return error non-existent id', async () => {
      const dao = getDao();
      const result = await dao.getById(new ObjectId().toHexString());

      expect(result.isError()).toBe(true);
    });

    it('should return UserNotFound for a deleted user by default', async () => {
      const dao = getDao();
      const result = await dao.getById(factory.idString('deleted'));

      expect(result.isError()).toBe(true);
      expect(result.getError()?.message).toContain('not found');
    });

    it('should return a deleted user when includeDeleted is true', async () => {
      const dao = getDao();
      const result = await dao.getById(factory.idString('deleted'), {
        includeDeleted: true,
      });

      expect(result.isOk()).toBe(true);
      const user = result.getDataOrThrow();
      expect(user.deletedAt).toBeDefined();
    });
  });

  describe('get()', () => {
    it('should return active users with public fields only', async () => {
      const dao = getDao();
      const users = await dao.get();

      expect(users.length).toBe(3);

      users.forEach(user => {
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('_id');
        expect(user.password).toBeUndefined();
        expect(user.secret).toBeUndefined();
        expect(user.failedLogins).toBeUndefined();
        expect(user.accountUnlockCode).toBeUndefined();
      });
    });

    it('should exclude deleted users', async () => {
      const dao = getDao();
      const users = await dao.get();

      const deletedUser = users.find(u => u.username === 'deleted');
      expect(deletedUser).toBeUndefined();
    });

    it('should exclude the system user', async () => {
      const dao = getDao();
      const users = await dao.get();

      const publicUser = users.find(u => u.username === 'public');
      expect(publicUser).toBeUndefined();
    });

    it('should return users with groups', async () => {
      const dao = getDao();
      const users = await dao.get();

      const active1 = users.find(user => user.username === 'active1');
      expect(active1).toBeDefined();
      expect(active1!.groups).toEqual([
        expect.objectContaining({ name: 'Group A' }),
        expect.objectContaining({ name: 'Group B' }),
      ]);

      const active2 = users.find(user => user.username === 'active2');
      expect(active2).toBeDefined();
      expect(active2!.groups).toEqual([expect.objectContaining({ name: 'Group B' })]);
    });

    it('should filter by query', async () => {
      const dao = getDao();
      let users = await dao.get({ username: 'active2' });

      expect(users.length).toBe(1);
      expect(users[0].email).toBe('active2@test.com');

      users = await dao.get({ email: 'sensitive@test.com' });

      expect(users.length).toBe(1);
      expect(users[0].username).toBe('withsensitive');
    });

    it('should return empty array when query matches nothing', async () => {
      const dao = getDao();
      const users = await dao.get({ username: 'nonexistent' });

      expect(users).toEqual([]);
    });
  });
});
