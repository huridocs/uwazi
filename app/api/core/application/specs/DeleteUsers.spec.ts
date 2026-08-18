import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { UserRole } from '#shared/types/userSchema.js';
import { User as Actor } from '#api/users.v2/model/User.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import { DeleteUsersUseCaseFactory } from '#api/core/infrastructure/factories/DeleteUsersUseCaseFactory.js';
import {
  IsDeletingSelf,
  IsDeleteOfLastUser,
  IsDeleteOfPublicUser,
} from '#api/core/domain/user/errors.js';

const f = getFixturesFactory();

const publicUser = {
  _id: new ObjectId(PUBLIC_USER_ID),
  username: 'public',
  role: UserRole.COLLABORATOR,
  email: 'public@uwazi.local',
};

const fixtures: DBFixture = {
  users: [
    f.user({ username: 'admin', role: UserRole.ADMIN, email: 'admin@test.com' }),
    f.user({ username: 'user1', role: UserRole.EDITOR, email: 'user1@test.com' }),
    f.user({ username: 'user2', role: UserRole.EDITOR, email: 'user2@test.com' }),
    f.user({
      username: 'deletedUser',
      role: UserRole.EDITOR,
      email: 'deleted@test.com',
      deletedAt: '1',
    }),
    publicUser,
  ],
  usergroups: [
    f.usergroup('Researchers', [{ refId: f.idString('user1') }, { refId: f.idString('user2') }]),
    f.usergroup('Journalists', [{ refId: f.idString('user1') }]),
  ],
  settings: [{ site_name: 'Uwazi', languages: [{ key: 'en', label: 'English', default: true }] }],
};

const admin = new Actor(f.idString('admin'), 'admin', []);

const createSut = (actor: Actor = admin) =>
  testingEnvironment.runWithContext(() => DeleteUsersUseCaseFactory.default(), { actor });

const activeUsernames = async () => {
  const stored = await testingEnvironment.db.getAllFrom('users');
  return stored.filter(user => !user.deletedAt).map(user => user.username);
};

const memberIds = async () => {
  const groups = await testingEnvironment.db.getAllFrom('usergroups');
  return groups.flatMap(group => group.members.map(({ refId }: { refId: string }) => refId));
};

describe('DeleteUsers', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should soft delete a user and return the deleted count', async () => {
    const deletedCount = await createSut().execute({ ids: [f.idString('user1')] });

    expect(deletedCount).toBe(1);
    expect(await activeUsernames()).toEqual(['admin', 'user2', 'public']);
  });

  it('should delete several users at once and remove them from every group', async () => {
    const deletedCount = await createSut().execute({
      ids: [f.idString('user1'), f.idString('user2')],
    });

    expect(deletedCount).toBe(2);
    expect(await activeUsernames()).toEqual(['admin', 'public']);
    expect(await memberIds()).toEqual([]);
  });

  it('should refuse to delete the public user', async () => {
    await expect(createSut().execute({ ids: [PUBLIC_USER_ID.toString()] })).rejects.toThrow(
      IsDeleteOfPublicUser
    );

    expect(await activeUsernames()).toEqual(['admin', 'user1', 'user2', 'public']);
  });

  it('should refuse to delete the public user when it is part of a bulk delete', async () => {
    await expect(
      createSut().execute({ ids: [f.idString('user1'), PUBLIC_USER_ID.toString()] })
    ).rejects.toThrow(IsDeleteOfPublicUser);

    expect(await activeUsernames()).toEqual(['admin', 'user1', 'user2', 'public']);
  });

  it('should refuse to delete the actor, alone or within a bulk delete', async () => {
    await expect(createSut().execute({ ids: [f.idString('admin')] })).rejects.toThrow(
      IsDeletingSelf
    );

    await expect(
      createSut().execute({ ids: [f.idString('user1'), f.idString('admin')] })
    ).rejects.toThrow(IsDeletingSelf);

    expect(await activeUsernames()).toEqual(['admin', 'user1', 'user2', 'public']);
  });

  it('should not count duplicated or unknown ids towards the last user check', async () => {
    await createSut().execute({ ids: [f.idString('user2')] });

    const deletedCount = await createSut().execute({
      ids: [f.idString('user1'), f.idString('user1'), f.idString('ghost')],
    });

    expect(deletedCount).toBe(1);
    expect(await activeUsernames()).toEqual(['admin', 'public']);
  });

  describe('when a single active user is left', () => {
    beforeEach(async () => {
      await createSut().execute({ ids: [f.idString('user1'), f.idString('user2')] });
    });

    it('should refuse the delete, ignoring soft deleted and system users in the count', async () => {
      await expect(createSut().execute({ ids: [f.idString('ghost')] })).rejects.toThrow(
        IsDeleteOfLastUser
      );

      expect(await activeUsernames()).toEqual(['admin', 'public']);
    });

    it('should report the self delete first, as the v1 flow did', async () => {
      await expect(createSut().execute({ ids: [f.idString('admin')] })).rejects.toThrow(
        IsDeletingSelf
      );
    });
  });
});
