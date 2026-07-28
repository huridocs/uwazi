/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { UserRole } from '#api/core/domain/user/User.js';
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
