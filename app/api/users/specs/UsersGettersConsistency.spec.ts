import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import users from '../users.js';
import usersModel from '../usersModel.js';
import fixtures, { userId, blockedUserId, userToDelete } from './fixtures.js';

const configs = [
  { name: 'V1', v2: false },
  { name: 'V2', v2: true },
];

describe('V1 / V2 Users DAO consistency', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    testingTenants.restoreCurrentFn();
    await testingEnvironment.tearDown();
  });

  describe.each(configs)('$name', ({ v2 }) => {
    beforeEach(() => {
      testingTenants.mockCurrentTenant({
        featureFlags: v2 ? { v2UsersGet: true } : {},
      });
    });

    describe('get()', () => {
      it('should return active users without sensitive fields', async () => {
        const result = await users.get({});

        expect(result.length).toBeGreaterThan(0);

        result.forEach(user => {
          expect(user.password).toBeUndefined();
          expect(user.secret).toBeUndefined();
          expect(user.failedLogins).toBeUndefined();
          expect(user.accountUnlockCode).toBeUndefined();
        });
      });

      it('should exclude soft-deleted users', async () => {
        await usersModel.db.updateOne({ _id: userToDelete }, { $set: { deletedAt: new Date() } });

        const result = await users.get({});
        expect(result.find(u => u._id.toString() === userToDelete.toString())).toBeUndefined();
      });

      it('should return matching groups', async () => {
        const result = await users.get({});

        if (!v2) {
          expect(result.some(u => u.groups)).toBe(false);
          return;
        }

        expect(result.length).toBeGreaterThan(0);

        const userWithGroups = result.find(u => u.groups && u.groups.length > 0);
        expect(userWithGroups).toBeDefined();

        const userWithoutGroups = result.find(u => u.groups && u.groups.length === 0);
        expect(userWithoutGroups).toBeDefined();
      });
    });

    describe('getById()', () => {
      it('should return the user without password or groups', async () => {
        const user = await users.getById(userId);

        expect(user).not.toBeNull();
        expect(user._id.toString()).toBe(userId.toString());
        expect(user.username).toBe('username');
        expect(user.email).toBe('test@email.com');
        expect(user.role).toBe('admin');
        expect(user.password).toBeUndefined();
        expect(user.secret).toBeUndefined();
        expect(user.groups).toBeUndefined();
      });

      it('should return user with groups when includeGroups is true', async () => {
        const user = await users.getById(userId, '', true);

        expect(user).not.toBeNull();
        expect(user.groups).toBeDefined();
        expect(user.groups.length).toBeGreaterThanOrEqual(1);
        expect(user.groups[0]).toHaveProperty('_id');
        expect(user.groups[0]).toHaveProperty('name');
      });

      it('should return null for non-existent user', async () => {
        const result = await users.getById(new ObjectId().toString());
        expect(result).toBeNull();
      });

      it('should return null for a deleted user by default', async () => {
        await usersModel.db.updateOne({ _id: userToDelete }, { $set: { deletedAt: new Date() } });

        const result = await users.getById(userToDelete);
        expect(result).toBeNull();
      });

      it('should return deleted user when includeDeleted is true', async () => {
        await usersModel.db.updateOne({ _id: userToDelete }, { $set: { deletedAt: new Date() } });

        const user = await users.getById(userToDelete, '', false, true);

        expect(user).not.toBeNull();
        expect(user._id.toString()).toBe(userToDelete.toString());
        expect(user.deletedAt).toBeDefined();
      });

      it('should exclude password by default and include when requested', async () => {
        const noPassword = await users.getById(blockedUserId);
        expect(noPassword).not.toBeNull();
        expect(noPassword.password).toBeUndefined();

        const withPassword = await users.getById(blockedUserId, '+password');
        expect(withPassword).not.toBeNull();
        expect(withPassword.password).toBeDefined();
      });
    });
  });
});
