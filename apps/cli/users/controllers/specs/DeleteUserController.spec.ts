import { UserNotFound } from '#api/core/domain/user/errors.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DeletedUserOutputSchema } from '../../contracts.js';
import { DeleteUserController } from '../DeleteUserController.js';
import { ControllerSpecs } from '../../../testing/ControllerSpecs.js';
import { f, fixtures } from './fixtures.js';

describe.each(ControllerSpecs.backends)('DeleteUserController ($name)', ({ postgresCore }) => {
  const storedUser = async (username: string) =>
    (await ControllerSpecs.stored(postgresCore, 'users')).find(user => user.username === username);

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
    ControllerSpecs.useBackend(postgresCore);
  });

  it('should soft-delete a user found by username', async () => {
    const output = await ControllerSpecs.asCli(async () =>
      DeleteUserController.handle({ username: 'editor' })
    );

    expect(DeletedUserOutputSchema.parse(output)).toEqual({ id: f.idString('editor') });
    expect((await storedUser('editor'))?.deletedAt).toBeTruthy();
  });

  it('should soft-delete a user found by id', async () => {
    await ControllerSpecs.asCli(async () =>
      DeleteUserController.handle({ id: f.idString('editor') })
    );

    expect((await storedUser('editor'))?.deletedAt).toBeTruthy();
  });

  it.each([
    ['an already deleted user', { username: 'gone' }],
    ['an unknown username', { username: 'nobody' }],
    ['an already deleted id', { id: f.idString('gone') }],
    ['an unknown id', { id: 'ffffffffffffffffffffffff' }],
  ])('should fail with not found for %s', async (_case, reference) => {
    await expect(
      ControllerSpecs.asCli(async () => DeleteUserController.handle(reference))
    ).rejects.toThrow(UserNotFound);
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});
