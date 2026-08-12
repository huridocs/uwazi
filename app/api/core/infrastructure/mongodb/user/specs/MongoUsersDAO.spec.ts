/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { PUBLIC_USER_ID, UserRole } from '#api/core/domain/user/User.js';
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

  describe('findOne()', () => {
    it('should return the full user document by default, with no field stripping', async () => {
      const dao = getDao();
      const user = await dao.findOne({ email: 'active1@test.com' });

      expect(user?.username).toBe('active1');
      expect(user?.role).toBe('admin');
      expect(user?.password).toBeDefined();
    });

    it('should apply the given projection', async () => {
      const dao = getDao();
      const user = await dao.findOne(
        { _id: withsensitiveId },
        { projection: { password: 0, secret: 0, failedLogins: 0, accountUnlockCode: 0 } }
      );

      expect(user?.username).toBe('withsensitive');
      expect(user?.password).toBeUndefined();
      expect(user?.secret).toBeUndefined();
      expect(user?.failedLogins).toBeUndefined();
      expect(user?.accountUnlockCode).toBeUndefined();
    });

    it('should return null for a soft-deleted user by default', async () => {
      const dao = getDao();
      const user = await dao.findOne({ email: 'deleted@test.com' });

      expect(user).toBeNull();
    });

    it('should return a soft-deleted user when includeDeleted is true', async () => {
      const dao = getDao();
      const user = await dao.findOne({ email: 'deleted@test.com' }, { includeDeleted: true });

      expect(user?.username).toBe('deleted');
    });

    it('should return null when no user matches', async () => {
      const dao = getDao();
      const user = await dao.findOne({ email: 'nobody@test.com' });

      expect(user).toBeNull();
    });
  });

  describe('getById()', () => {
    it('should exclude password, secret, failedLogins, accountUnlockCode and accountLocked by default', async () => {
      const dao = getDao();
      const result = await dao.getById(withsensitiveId.toString());

      const user = result.getDataOrThrow();
      expect(user.username).toBe('withsensitive');
      expect(user.password).toBeUndefined();
      expect(user.secret).toBeUndefined();
      expect(user.failedLogins).toBeUndefined();
      expect(user.accountUnlockCode).toBeUndefined();
      expect('accountLocked' in user).toBe(false);
    });

    it('should include accountLocked when includeAccountLocked is true', async () => {
      const dao = getDao();
      const result = await dao.getById(withsensitiveId.toString(), { includeAccountLocked: true });

      const user = result.getDataOrThrow();
      expect(user.accountLocked).toBe(false);
    });

    it('should fail when no user matches', async () => {
      const dao = getDao();
      const result = await dao.getById(new ObjectId().toString());

      expect(result.isError()).toBe(true);
    });
  });

  describe('exists()', () => {
    it('should return true when a matching active, non-public user exists', async () => {
      const dao = getDao();
      expect(await dao.exists({ username: 'active1' })).toBe(true);
    });

    it('should return false for a soft-deleted user', async () => {
      const dao = getDao();
      expect(await dao.exists({ username: 'deleted' })).toBe(false);
    });

    it('should return false for the system/public user', async () => {
      const dao = getDao();
      expect(await dao.exists({ username: 'public' })).toBe(false);
    });

    it('should return false when no user matches', async () => {
      const dao = getDao();
      expect(await dao.exists({ username: 'nonexistent' })).toBe(false);
    });
  });

  describe('count()', () => {
    it('should count users matching the filter, excluding soft-deleted users', async () => {
      const dao = getDao();
      const count = await dao.count(dao.notPublicUserFilter());

      expect(count).toBe(3);
    });
  });

  describe('updateOne()', () => {
    it('should update the given fields for an active user', async () => {
      const dao = getDao();
      await dao.updateOne(
        { _id: new ObjectId(factory.idString('active1')) },
        { $set: { username: 'renamed' } }
      );

      const updated = await dao.findOne({ _id: new ObjectId(factory.idString('active1')) });
      expect(updated?.username).toBe('renamed');
    });

    it('should unset fields', async () => {
      const dao = getDao();
      await dao.updateOne(
        { _id: new ObjectId(withsensitiveId.toString()) },
        { $unset: { accountLocked: 1, accountUnlockCode: 1, failedLogins: 1 } }
      );

      const updated = await dao.findOne({ _id: withsensitiveId });
      expect(updated?.accountLocked).toBeUndefined();
      expect(updated?.accountUnlockCode).toBeUndefined();
      expect(updated?.failedLogins).toBeUndefined();
    });

    it('should not update a soft-deleted user by default', async () => {
      const dao = getDao();
      await dao.updateOne(
        { _id: new ObjectId(factory.idString('deleted')) },
        { $set: { username: 'renamed' } }
      );

      const updated = await dao.findOne(
        { _id: new ObjectId(factory.idString('deleted')) },
        { includeDeleted: true }
      );
      expect(updated?.username).toBe('deleted');
    });

    it('should update a soft-deleted user when includeDeleted is true', async () => {
      const dao = getDao();
      await dao.updateOne(
        { _id: new ObjectId(factory.idString('deleted')) },
        { $set: { username: 'renamed' } },
        { includeDeleted: true }
      );

      const updated = await dao.findOne(
        { _id: new ObjectId(factory.idString('deleted')) },
        { includeDeleted: true }
      );
      expect(updated?.username).toBe('renamed');
    });
  });

  describe('insertOne()', () => {
    it('should insert a new user document', async () => {
      const dao = getDao();
      const newId = new ObjectId();
      await dao.insertOne({
        _id: newId,
        username: 'brandnew',
        role: UserRole.EDITOR,
        email: 'brandnew@test.com',
      });

      const user = await dao.findOne({ email: 'brandnew@test.com' });
      expect(user?.username).toBe('brandnew');
    });
  });

  describe('findByIds()', () => {
    it('should return the matching, non-deleted, non-public users', async () => {
      const dao = getDao();
      const users = await dao.findByIds([
        factory.idString('active1'),
        factory.idString('active2'),
      ]);

      expect(users.map(u => u.username).sort()).toEqual(['active1', 'active2']);
    });

    it('should exclude soft-deleted users by default', async () => {
      const dao = getDao();
      const users = await dao.findByIds([factory.idString('deleted')]);

      expect(users).toEqual([]);
    });

    it('should include soft-deleted users when includeDeleted is true', async () => {
      const dao = getDao();
      const users = await dao.findByIds([factory.idString('deleted')], { includeDeleted: true });

      expect(users.map(u => u.username)).toEqual(['deleted']);
    });

    it('should exclude the public/system user even when explicitly requested', async () => {
      const dao = getDao();
      const users = await dao.findByIds([withsensitiveId.toString(), PUBLIC_USER_ID.toString()]);

      expect(users.map(u => u.username)).toEqual(['withsensitive']);
    });

    it('should return an empty array for an empty id list', async () => {
      const dao = getDao();
      expect(await dao.findByIds([])).toEqual([]);
    });

    it('should return an empty array when no id matches', async () => {
      const dao = getDao();
      expect(await dao.findByIds([new ObjectId().toString()])).toEqual([]);
    });
  });

  describe('findByEmailOrUsername()', () => {
    it('should match by exact username, case-insensitively', async () => {
      const dao = getDao();
      const users = await dao.findByEmailOrUsername('ACTIVE1');

      expect(users).toEqual([
        { _id: factory.idString('active1'), username: 'active1', email: 'active1@test.com' },
      ]);
    });

    it('should match by exact email, case-insensitively', async () => {
      const dao = getDao();
      const users = await dao.findByEmailOrUsername('ACTIVE2@TEST.COM');

      expect(users.map(u => u.username)).toEqual(['active2']);
    });

    it('should not match a partial/prefix term', async () => {
      const dao = getDao();
      const users = await dao.findByEmailOrUsername('active');

      expect(users).toEqual([]);
    });

    it('should exclude soft-deleted users', async () => {
      const dao = getDao();
      const users = await dao.findByEmailOrUsername('deleted');

      expect(users).toEqual([]);
    });

    it('should exclude the public/system user', async () => {
      const dao = getDao();
      const users = await dao.findByEmailOrUsername('public');

      expect(users).toEqual([]);
    });

    it('should return an empty array when nothing matches', async () => {
      const dao = getDao();
      expect(await dao.findByEmailOrUsername('nonexistent')).toEqual([]);
    });
  });

  describe('softDelete()', () => {
    it('should set deletedAt on the given ids', async () => {
      const dao = getDao();
      const modifiedCount = await dao.softDelete([factory.idString('active1')]);

      expect(modifiedCount).toBe(1);
      const updated = await dao.findOne(
        { _id: new ObjectId(factory.idString('active1')) },
        { includeDeleted: true }
      );
      expect(updated?.deletedAt).toBeDefined();
    });

    it('should return 0 for an empty list', async () => {
      const dao = getDao();
      expect(await dao.softDelete([])).toBe(0);
    });
  });
});
