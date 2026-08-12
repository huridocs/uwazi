import { UserGroupNameExists } from '#api/core/domain/userGroup/errors.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UpdateUserGroupUseCaseFactory } from '#api/core/infrastructure/factories/UpdateUserGroupUseCaseFactory.js';

const f = getFixturesFactory();

const fixtures = {
  usergroups: [f.usergroup('Existing'), f.usergroup('Other')],
};

const createSut = () =>
  testingEnvironment.runWithContext(() => UpdateUserGroupUseCaseFactory.default());

describe('UpdateUserGroupUseCase', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should rename a group and replace its members', async () => {
    await createSut().execute({
      id: f.id('Existing').toHexString(),
      name: 'Renamed',
      memberIds: [],
    });

    const stored = await testingEnvironment.db.getAllFrom('usergroups');
    expect(stored).toContainEqual(expect.objectContaining({ name: 'Renamed' }));
  });

  it('should allow renaming a group to its own current name', async () => {
    await expect(
      createSut().execute({
        id: f.id('Existing').toHexString(),
        name: 'Existing',
        memberIds: [],
      })
    ).resolves.not.toThrow();
  });

  it('should throw when renaming to a name already used by another group', async () => {
    await expect(
      createSut().execute({
        id: f.id('Existing').toHexString(),
        name: 'Other',
        memberIds: [],
      })
    ).rejects.toThrow(UserGroupNameExists);
  });
});
