import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { User, UserRole } from '#api/core/domain/user/User.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';
import { PostgresUserGroupsDataSource } from '../PostgresUserGroupsDataSource.js';

const TENANT_ID = 'test-tenant';

const managerFor = (tenantId: string) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const makeDS = (tenantId = TENANT_ID) =>
  new PostgresUserGroupsDataSource({
    tenantId,
    pgTransactionManager: managerFor(tenantId),
    idGenerator: IdGeneratorFactory.default(),
  });

const setGroupFixtures = async () => {
  await testingPG.setFixtures({
    usergroups: [
      { _id: 'empty', tenant_id: TENANT_ID, name: 'Empty', members: [] },
      {
        _id: 'with-one-member',
        tenant_id: TENANT_ID,
        name: 'With one member',
        members: ['existing1'],
      },
      {
        _id: 'with-two-members',
        tenant_id: TENANT_ID,
        name: 'With two members',
        members: ['existing1', 'existing2'],
      },
    ],
  });
};

const newUser = (overrides: Partial<ConstructorParameters<typeof User>[0]>) =>
  new User({
    _id: 'newuser',
    username: 'newuser',
    role: UserRole.COLLABORATOR,
    email: 'newuser@provider.tld',
    ...overrides,
  });

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingPG.clear(['usergroups']);
  await setGroupFixtures();
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresUserGroupsDataSource', () => {
  describe('updateUserGroups', () => {
    it('should add a user to a group', async () => {
      const ds = makeDS();

      const user = newUser({ _id: 'newuser', groups: [{ _id: 'empty', name: 'Empty' }] });
      await ds.updateUserGroups(user);

      const groups = await testingPG.getAllFrom('usergroups');
      const emptyGroup = groups.find(g => g._id === 'empty');

      expect(emptyGroup?.members).toEqual(['newuser']);
    });

    it('should add a user to multiple groups', async () => {
      const ds = makeDS();

      const user = newUser({
        _id: 'newuser',
        groups: [
          { _id: 'empty', name: 'Empty' },
          { _id: 'with-one-member', name: 'With one member' },
        ],
      });
      await ds.updateUserGroups(user);

      const groups = await testingPG.getAllFrom('usergroups');
      const emptyGroup = groups.find(g => g._id === 'empty');
      const oneMemberGroup = groups.find(g => g._id === 'with-one-member');

      expect(emptyGroup?.members).toEqual(['newuser']);
      expect(oneMemberGroup?.members).toEqual(['existing1', 'newuser']);
    });

    it('should remove a user if it is no longer in the group', async () => {
      const ds = makeDS();

      const user = newUser({ _id: 'existing1', groups: [] });
      await ds.updateUserGroups(user);

      const groups = await testingPG.getAllFrom('usergroups');
      const oneMemberGroup = groups.find(g => g._id === 'with-one-member');
      const twoMemberGroup = groups.find(g => g._id === 'with-two-members');

      expect(oneMemberGroup?.members).toEqual([]);
      expect(twoMemberGroup?.members).toEqual(['existing2']);
    });

    it('should add and remove a user from different groups', async () => {
      const ds = makeDS();

      const user = newUser({ _id: 'existing1', groups: [{ _id: 'empty', name: 'Empty' }] });
      await ds.updateUserGroups(user);

      const groups = await testingPG.getAllFrom('usergroups');
      const emptyGroup = groups.find(g => g._id === 'empty');
      const oneMemberGroup = groups.find(g => g._id === 'with-one-member');
      const twoMemberGroup = groups.find(g => g._id === 'with-two-members');

      expect(emptyGroup?.members).toEqual(['existing1']);
      expect(oneMemberGroup?.members).toEqual([]);
      expect(twoMemberGroup?.members).toEqual(['existing2']);
    });
  });

  describe('getUserGroups', () => {
    it('return user groups', async () => {
      const ds = makeDS();

      const user = newUser({ _id: 'existing1' });
      const foundGroups = await ds.getUserGroups(user);

      expect(foundGroups).toMatchObject([
        { _id: 'with-one-member', name: 'With one member' },
        { _id: 'with-two-members', name: 'With two members' },
      ]);
    });
  });

  describe('create', () => {
    it('should create a group with the given name and members', async () => {
      const ds = makeDS();

      const created = await ds.create({ name: 'New group', memberIds: ['existing1'] });

      const groups = await testingPG.getAllFrom('usergroups');
      const found = groups.find(g => g._id === created.id);
      expect(found).toMatchObject({ name: 'New group', members: ['existing1'] });
    });
  });

  describe('update', () => {
    it('should rename a group and replace its members', async () => {
      const ds = makeDS();

      await ds.update({ id: 'with-one-member', name: 'Renamed', memberIds: ['existing2'] });

      const groups = await testingPG.getAllFrom('usergroups');
      const updated = groups.find(g => g._id === 'with-one-member');
      expect(updated).toMatchObject({ name: 'Renamed', members: ['existing2'] });
    });
  });

  describe('delete', () => {
    it('should delete multiple groups by id', async () => {
      const ds = makeDS();

      await ds.delete(['empty', 'with-one-member']);

      const groups = await testingPG.getAllFrom('usergroups');
      expect(groups.map(g => g.name)).toEqual(['With two members']);
    });

    it('should be a no-op for an unknown id', async () => {
      const ds = makeDS();

      await expect(ds.delete(['unknown'])).resolves.not.toThrow();

      const groups = await testingPG.getAllFrom('usergroups');
      expect(groups).toHaveLength(3);
    });
  });

  describe('checkUniqueName', () => {
    it('should be case-insensitive', async () => {
      const ds = makeDS();

      expect((await ds.checkUniqueName('empty')).isError()).toBe(true);
      expect((await ds.checkUniqueName('EMPTY')).isError()).toBe(true);
      expect((await ds.checkUniqueName('nonexistent')).isOk()).toBe(true);
    });

    it('should exclude the given id, so renaming to the current name is allowed', async () => {
      const ds = makeDS();

      const excludingSelf = await ds.checkUniqueName('Empty', 'empty');
      expect(excludingSelf.isOk()).toBe(true);

      const excludingOther = await ds.checkUniqueName('Empty', 'with-one-member');
      expect(excludingOther.isError()).toBe(true);
    });
  });
});
