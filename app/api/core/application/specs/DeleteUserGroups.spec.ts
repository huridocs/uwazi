import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { MongoUserGroupsDataSource } from '#api/core/infrastructure/mongodb/user/MongoUserGroupsDataSource.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DeleteUserGroupsUseCase } from '../DeleteUserGroups.js';

const f = getFixturesFactory();

const fixtures = {
  usergroups: [f.usergroup('One'), f.usergroup('Two')],
};

const createUseCase = () =>
  new DeleteUserGroupsUseCase({
    userGroupsDS: new MongoUserGroupsDataSource(
      getConnection(),
      TransactionManagerFactory.default(),
      IdGeneratorFactory.default()
    ),
  });

describe('DeleteUserGroupsUseCase', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should delete the given groups', async () => {
    const result = await createUseCase().execute({
      ids: [f.id('One').toHexString(), f.id('Two').toHexString()],
    });

    expect(result).toBe(true);
    const stored = await testingEnvironment.db.getAllFrom('usergroups');
    expect(stored).toHaveLength(0);
  });

  it('should not throw for an unknown id', async () => {
    await expect(
      createUseCase().execute({ ids: [f.id('unknown').toHexString()] })
    ).resolves.toBe(true);
  });
});
