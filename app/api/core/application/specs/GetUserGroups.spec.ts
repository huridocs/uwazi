import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { MongoUserGroupsDataSource } from '#api/core/infrastructure/mongodb/user/MongoUserGroupsDataSource.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UserRole } from '#shared/types/userSchema.js';
import { GetUserGroupsUseCase } from '../GetUserGroups.js';

const f = getFixturesFactory();

const fixtures = {
  users: [f.user({ username: 'existing1', role: UserRole.ADMIN })],
  usergroups: [f.usergroup('With member', [{ refId: f.idString('existing1') }])],
};

const createUseCase = () =>
  new GetUserGroupsUseCase({
    userGroupsDS: new MongoUserGroupsDataSource(
      getConnection(),
      TransactionManagerFactory.default(),
      IdGeneratorFactory.default()
    ),
  });

describe('GetUserGroupsUseCase', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should return all groups with enriched members', async () => {
    const groups = await createUseCase().execute();

    expect(groups).toMatchObject([
      {
        name: 'With member',
        members: [{ refId: f.idString('existing1'), username: 'existing1' }],
      },
    ]);
  });
});
