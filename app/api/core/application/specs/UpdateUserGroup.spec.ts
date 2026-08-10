import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { MongoUserGroupsDataSource } from '#api/core/infrastructure/mongodb/user/MongoUserGroupsDataSource.js';
import { UserGroupNameExists } from '#api/core/domain/userGroup/errors.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UpdateUserGroupUseCase } from '../UpdateUserGroup.js';

const f = getFixturesFactory();

const fixtures = {
  usergroups: [f.usergroup('Existing'), f.usergroup('Other')],
};

const createUseCase = () =>
  new UpdateUserGroupUseCase({
    userGroupsDS: new MongoUserGroupsDataSource(
      getConnection(),
      TransactionManagerFactory.default(),
      IdGeneratorFactory.default()
    ),
  });

describe('UpdateUserGroupUseCase', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should rename a group and replace its members', async () => {
    const updated = await createUseCase().execute({
      id: f.id('Existing').toHexString(),
      name: 'Renamed',
      memberIds: [],
    });

    expect(updated.name).toBe('Renamed');
  });

  it('should allow renaming a group to its own current name', async () => {
    await expect(
      createUseCase().execute({
        id: f.id('Existing').toHexString(),
        name: 'Existing',
        memberIds: [],
      })
    ).resolves.not.toThrow();
  });

  it('should throw when renaming to a name already used by another group', async () => {
    await expect(
      createUseCase().execute({
        id: f.id('Existing').toHexString(),
        name: 'Other',
        memberIds: [],
      })
    ).rejects.toThrow(UserGroupNameExists);
  });
});
