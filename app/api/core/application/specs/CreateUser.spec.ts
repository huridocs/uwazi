import { ZodError } from 'zod';
import { UserRole } from '#api/core/domain/user/User.js';
import { EmailInUse, UsernameExists } from '#api/core/domain/user/errors.js';
import { UserGroupNotFound } from '#api/core/domain/userGroup/errors.js';
import { CreateUserUseCaseFactory } from '#api/core/infrastructure/factories/CreateUserUseCaseFactory.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

const f = getFixturesFactory();

const fixtures = {
  users: [
    f.user({ username: 'existing', role: UserRole.EDITOR, email: 'existing@test.com' }),
    f.user({
      username: 'gone',
      role: UserRole.EDITOR,
      email: 'gone@test.com',
      deletedAt: new Date(),
    }),
  ],
  usergroups: [f.usergroup('Researchers', [])],
};

const createSut = () => testingEnvironment.runWithContext(() => CreateUserUseCaseFactory.default());

const input = (overrides: Record<string, unknown> = {}) => ({
  username: 'newguy',
  email: 'newguy@test.com',
  role: UserRole.COLLABORATOR,
  domain: 'http://uwazi',
  ...overrides,
});

const welcomeEmailJobs = async () =>
  (await testingEnvironment.db.getAllFrom('jobs')).filter(
    job => job.name === 'SendWelcomeEmailHandler'
  );

describe('CreateUser', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should store the new user with a trimmed username', async () => {
    await createSut().execute(input({ username: '  newguy ' }));

    const users = await testingEnvironment.db.getAllFrom('users');
    expect(users).toContainEqual(
      expect.objectContaining({
        username: 'newguy',
        email: 'newguy@test.com',
        role: 'collaborator',
      })
    );
  });

  it('should dispatch the welcome email by default', async () => {
    const user = await createSut().execute(input());

    expect(await welcomeEmailJobs()).toEqual([
      expect.objectContaining({
        params: expect.objectContaining({ userId: user._id, domain: 'http://uwazi' }),
      }),
    ]);
  });

  it('should not dispatch the welcome email when asked not to', async () => {
    await createSut().execute(input({ sendWelcomeEmail: false }));

    expect(await welcomeEmailJobs()).toEqual([]);
  });

  it('should reject an invalid profile through the domain rules', async () => {
    await expect(createSut().execute(input({ username: 'new guy' }))).rejects.toThrow(ZodError);
  });

  it('should reject a duplicated username', async () => {
    await expect(createSut().execute(input({ username: 'existing' }))).rejects.toThrow(
      UsernameExists
    );
  });

  it('should reject a duplicated email', async () => {
    await expect(createSut().execute(input({ email: 'existing@test.com' }))).rejects.toThrow(
      EmailInUse
    );
  });

  it('should accept the username and email of a soft deleted user', async () => {
    await createSut().execute(input({ username: 'gone', email: 'gone@test.com' }));

    const users = await testingEnvironment.db.getAllFrom('users');
    expect(users.filter(user => user.username === 'gone')).toHaveLength(2);
  });

  it('should assign the groups it is given', async () => {
    const user = await createSut().execute(
      input({ assignedGroupIds: [f.id('Researchers').toString()] })
    );

    const [group] = await testingEnvironment.db.getAllFrom('usergroups');
    expect(group.members).toEqual([{ refId: user._id }]);
  });

  it.each([
    ['an unknown group', () => f.idString('ghost-group')],
    ['a malformed group id', () => 'not-an-id'],
  ])('should reject %s without creating the user', async (_case, groupId) => {
    await expect(
      createSut().execute(input({ assignedGroupIds: [f.id('Researchers').toString(), groupId()] }))
    ).rejects.toThrow(UserGroupNotFound);

    const users = await testingEnvironment.db.getAllFrom('users');
    expect(users.map(user => user.username)).not.toContain('newguy');
  });
});
