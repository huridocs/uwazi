import { UserGroupNameExists } from '#api/core/domain/userGroup/errors.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { CreateUserGroupUseCaseFactory } from '#api/core/infrastructure/factories/CreateUserGroupUseCaseFactory.js';

const f = getFixturesFactory();

const fixtures = {
  usergroups: [f.usergroup('Existing')],
};

const createSut = () =>
  testingEnvironment.runWithContext(() => CreateUserGroupUseCaseFactory.default());

describe('CreateUserGroupUseCase', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should create a group with the given name and members', async () => {
    const created = await createSut().execute({ name: 'New group', memberIds: [] });

    expect(created.name).toBe('New group');
    const stored = await testingEnvironment.db.getAllFrom('usergroups');
    expect(stored).toContainEqual(expect.objectContaining({ name: 'New group' }));
  });

  it('should throw when the name already exists, case-insensitively', async () => {
    await expect(createSut().execute({ name: 'existing', memberIds: [] })).rejects.toThrow(
      UserGroupNameExists
    );
  });
});
