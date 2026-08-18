import db from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import users from '../users.js';
import usersModel from '../usersModel.js';
import fixtures, { userId } from './fixtures.js';

describe('Users', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('getById', () => {
    it('should return the asked user without password or groups', async () => {
      const user = await users.getById(userId);
      expect(user.username).toBe('username');
      expect(user.password).toBe(undefined);
      expect(user.groups).toBe(undefined);
    });
    it('should return the asked user with groups if asked for', async () => {
      const user = await users.getById(userId, '-password', true);
      expect(user.username).toBe('username');
      expect(user.groups[0].name).toBe('Group 2');
    });

    it('should not fail if asking for groups but user does not exist', async () => {
      const user = await users.getById(db.id(), '-password', true);
      expect(user).toBe(null);
    });

    it('should return null for a deleted user', async () => {
      await usersModel.db.updateOne({ _id: userId }, { $set: { deletedAt: new Date() } });
      const user = await users.getById(userId);
      expect(user).toBeNull();
    });
  });

  describe('get', () => {
    it('should return all users without group data', async () => {
      const userList = await users.get();
      expect(userList.length).toBe(6);
      const groupData = userList.filter(u => u.groups !== undefined);
      expect(groupData.length).toBe(0);
    });

    it('should return all users with groups to which they belong', async () => {
      const userList = await users.get({}, '+groups');
      expect(userList.length).toBe(6);
      expect(userList[0].groups[0].name).toBe('Group 2');
      expect(userList[1].groups[0].name).toBe('Group 1');
    });

    it('should exclude soft-deleted users from results', async () => {
      await usersModel.db.updateOne({ _id: userId }, { $set: { deletedAt: new Date() } });
      const userList = await users.get();
      expect(userList.length).toBe(5);
      expect(userList.find(u => u._id.toString() === userId.toString())).toBeUndefined();
    });
  });
});
