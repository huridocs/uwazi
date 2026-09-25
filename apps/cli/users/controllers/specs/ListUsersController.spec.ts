import { UserRole } from '#api/core/domain/user/User.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UserListItemSchema } from '../../contracts.js';
import { ListUsersController } from '../ListUsersController.js';
import { ControllerSpecs } from '../../../testing/ControllerSpecs.js';
import { f, fixtures } from './fixtures.js';

const byUsername = <T extends { username: string }>(users: T[]) =>
  [...users].sort((a, b) => a.username.localeCompare(b.username));

describe.each(ControllerSpecs.backends)('ListUsersController ($name)', ({ postgresCore }) => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
    ControllerSpecs.useBackend(postgresCore);
  });

  it('should list the active users with their groups', async () => {
    const output = await ControllerSpecs.asCli(async () => ListUsersController.handle({}));

    expect(byUsername(UserListItemSchema.array().parse(output))).toEqual([
      {
        id: f.idString('admin'),
        username: 'admin',
        email: 'admin@test.com',
        role: 'admin',
        groups: [],
        using2fa: false,
        accountLocked: false,
      },
      {
        id: f.idString('editor'),
        username: 'editor',
        email: 'editor@test.com',
        role: 'editor',
        groups: [{ id: f.idString('Researchers'), name: 'Researchers' }],
        using2fa: false,
        accountLocked: false,
      },
    ]);
  });

  it('should filter by role', async () => {
    const output = await ControllerSpecs.asCli(async () =>
      ListUsersController.handle({ role: UserRole.EDITOR })
    );

    expect(output.map(u => u.username)).toEqual(['editor']);
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});
