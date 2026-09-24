import { UserRole } from '#api/core/domain/user/User.js';
import { EmailInUse, UserNotFound } from '#api/core/domain/user/errors.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UpdatedUserOutputSchema } from '../../contracts.js';
import { UpdateUserController } from '../UpdateUserController.js';
import { asCli, backends, f, fixtures, stored, useBackend } from './fixtures.js';

describe.each(backends)('UpdateUserController ($name)', ({ postgresCore }) => {
  const storedUser = async (username: string) =>
    (await stored(postgresCore, 'users')).find(user => user.username === username);

  const groupsOf = async (username: string) =>
    (await stored(postgresCore, 'usergroups'))
      .filter(group =>
        (group.members as unknown[]).some(
          member =>
            member === f.idString(username) ||
            (member as { refId?: unknown })?.refId?.toString() === f.idString(username)
        )
      )
      .map(group => group.name);

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
    useBackend(postgresCore);
  });

  it('should change only the given fields of a user found by username', async () => {
    const output = await asCli(async () =>
      UpdateUserController.handle({ username: 'editor', email: 'new@test.com' })
    );

    expect(UpdatedUserOutputSchema.parse(output)).toEqual({
      user: { id: f.idString('editor'), username: 'editor', email: 'new@test.com', role: 'editor' },
    });
    expect(await storedUser('editor')).toMatchObject({ email: 'new@test.com', role: 'editor' });
  });

  it('should find the user by id and rename it', async () => {
    await asCli(async () =>
      UpdateUserController.handle({
        id: f.idString('editor'),
        newUsername: 'renamed',
        role: UserRole.ADMIN,
      })
    );

    expect(await storedUser('renamed')).toMatchObject({ role: 'admin' });
  });

  it('should leave groups untouched unless given, and clear them with an empty list', async () => {
    await asCli(async () => UpdateUserController.handle({ username: 'editor', email: 'a@b.com' }));
    expect(await groupsOf('editor')).toEqual(['Researchers']);

    await asCli(async () => UpdateUserController.handle({ username: 'editor', groups: [] }));
    expect(await groupsOf('editor')).toEqual([]);
  });

  it.each(['gone', 'nobody'])('should not find %s', async username => {
    await expect(
      asCli(async () => UpdateUserController.handle({ username, email: 'x@test.com' }))
    ).rejects.toThrow(UserNotFound);
  });

  it('should fail with a conflict when the email is taken', async () => {
    await expect(
      asCli(async () =>
        UpdateUserController.handle({ username: 'editor', email: 'admin@test.com' })
      )
    ).rejects.toThrow(EmailInUse);
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});
