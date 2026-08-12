import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DeleteUserGroupsUseCaseFactory } from '#api/core/infrastructure/factories/DeleteUserGroupsUseCaseFactory.js';

const f = getFixturesFactory();

const fixtures = {
  usergroups: [f.usergroup('One'), f.usergroup('Two')],
};

const createSut = () =>
  testingEnvironment.runWithContext(() => DeleteUserGroupsUseCaseFactory.default());

describe('DeleteUserGroupsUseCase', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should delete the given groups', async () => {
    const result = await createSut().execute({
      ids: [f.id('One').toHexString(), f.id('Two').toHexString()],
    });

    expect(result).toBe(true);
    const stored = await testingEnvironment.db.getAllFrom('usergroups');
    expect(stored).toHaveLength(0);
  });

  it('should not throw for an unknown id', async () => {
    await expect(createSut().execute({ ids: [f.id('unknown').toHexString()] })).resolves.toBe(true);
  });
});
