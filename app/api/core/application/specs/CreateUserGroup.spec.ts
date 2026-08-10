import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { MongoUserGroupsDataSource } from '#api/core/infrastructure/mongodb/user/MongoUserGroupsDataSource.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { CreateUserGroupUseCase } from '../CreateUserGroup.js';

const f = getFixturesFactory();

const fixtures = {
  usergroups: [f.usergroup('Existing')],
};

const createUseCase = () =>
  new CreateUserGroupUseCase({
    userGroupsDS: new MongoUserGroupsDataSource(
      getConnection(),
      TransactionManagerFactory.default(),
      IdGeneratorFactory.default()
    ),
  });

describe('CreateUserGroupUseCase', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should create a group with the given name and members', async () => {
    const created = await createUseCase().execute({ name: 'New group', memberIds: [] });

    expect(created.name).toBe('New group');
    const stored = await testingEnvironment.db.getAllFrom('usergroups');
    expect(stored).toContainEqual(expect.objectContaining({ name: 'New group' }));
  });

  it('should throw when the name already exists, case-insensitively', async () => {
    await expect(createUseCase().execute({ name: 'existing', memberIds: [] })).rejects.toThrow(
      'duplicated_entry'
    );
  });
});
