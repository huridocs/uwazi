import { PUBLIC_USER_ID, User, UserRole } from '#api/core/domain/user/User.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ObjectId } from 'mongodb';
import { MongoUsersDataSource } from '../MongoUsersDataSource.js';

const f = getFixturesFactory();

const fixtures = {
  users: [
    { _id: PUBLIC_USER_ID, username: 'public', role: UserRole.COLLABORATOR },
    f.user({ username: 'existing1', role: UserRole.ADMIN }),
    f.user({ username: 'existing2', role: UserRole.EDITOR }),
    f.user({ username: 'deleted1', role: UserRole.COLLABORATOR, deletedAt: new Date() }),
    f.user({ username: 'deleted2', role: UserRole.COLLABORATOR, deletedAt: new Date() }),
  ],
};

const createDs = () => {
  const transactionManager = TransactionManagerFactory.default();
  const ds = new MongoUsersDataSource(getConnection(), transactionManager);
  return { ds, transactionManager };
};

describe('MongoUsersDataSource', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('validations and checks', () => {
    describe('checkUniqueUsername', () => {
      it('should return ok when username is available', async () => {
        const { ds } = createDs();
        const user = new User({
          _id: '1',
          username: 'newuser',
          role: UserRole.EDITOR,
          email: 'new@test.com',
        });
        const result = await ds.checkUniqueUsername(user);
        expect(result.isOk()).toBe(true);
      });

      it('should return fail when username already exists', async () => {
        const { ds } = createDs();
        const user = new User({
          _id: '1',
          username: 'existing1',
          role: UserRole.EDITOR,
          email: 'other@test.com',
        });
        const result = await ds.checkUniqueUsername(user);
        expect(result.isError()).toBe(true);
      });

      it('should return ok when username belongs to a soft-deleted user', async () => {
        const { ds } = createDs();
        const user = new User({
          _id: '1',
          username: 'deleted1',
          role: UserRole.EDITOR,
          email: 'new@test.com',
        });
        const result = await ds.checkUniqueUsername(user);
        expect(result.isOk()).toBe(true);
      });
    });

    describe('checkUniqueEmail', () => {
      it('should return ok when email is available', async () => {
        const { ds } = createDs();
        const user = new User({
          _id: '1',
          username: 'newuser',
          role: UserRole.EDITOR,
          email: 'new@test.com',
        });
        const result = await ds.checkUniqueEmail(user);
        expect(result.isOk()).toBe(true);
      });

      it('should return fail when email already exists', async () => {
        const { ds } = createDs();
        const user = new User({
          _id: '1',
          username: 'other',
          role: UserRole.EDITOR,
          email: 'existing1@provider.tld',
        });
        const result = await ds.checkUniqueEmail(user);
        expect(result.isError()).toBe(true);
      });

      it('should return ok when email belongs to a soft-deleted user', async () => {
        const { ds } = createDs();
        const user = new User({
          _id: '1',
          username: 'other',
          role: UserRole.EDITOR,
          email: 'deleted1@provider.tld',
        });
        const result = await ds.checkUniqueEmail(user);
        expect(result.isOk()).toBe(true);
      });
    });

    describe('countActiveUsers', () => {
      it('should return count of active users excluding the public user and deleted users', async () => {
        const { ds } = createDs();
        const count = await ds.countActiveUsers();
        expect(count).toBe(2);
      });
    });
  });

  describe('insert', () => {
    it('should insert a user into the database', async () => {
      const { ds } = createDs();
      const user = new User({
        _id: new ObjectId().toHexString(),
        username: 'newuser',
        role: UserRole.EDITOR,
        email: 'new@test.com',
      });
      await ds.insert(user);
      const users = await testingEnvironment.db.getAllFrom('users');
      expect(users.length).toBe(6);
    });
  });

  describe('delete', () => {
    it('should soft-delete users by ids', async () => {
      const { ds } = createDs();
      const existingUser = await testingEnvironment.db
        .getCollection('users')!
        .findOne({ username: 'existing1' });
      const modifiedCount = await ds.delete([existingUser!._id.toHexString()]);
      expect(modifiedCount).toBe(1);
      const updatedUser = await testingEnvironment.db
        .getCollection('users')!
        .findOne({ _id: existingUser!._id });
      expect(updatedUser!.deletedAt).toBeDefined();
    });

    it('should return 0 when given an empty array', async () => {
      const { ds } = createDs();
      const modifiedCount = await ds.delete([]);
      expect(modifiedCount).toBe(0);
    });
  });
});
