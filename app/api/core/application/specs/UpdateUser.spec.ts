import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { UpdateUserUseCaseFactory } from '#api/core/infrastructure/factories/UpdateUserUseCaseFactory.js';
import { UserRole } from '#api/core/domain/user/User.js';
import { User } from '#api/users.v2/model/User.js';
import { UnauthorizedError } from '#api/authorization.v2/errors/UnauthorizedError.js';

const f = getFixturesFactory();

const fixtures = {
  users: [
    f.user({ username: 'self', role: UserRole.EDITOR }),
    f.user({ username: 'other', role: UserRole.COLLABORATOR }),
    f.user({ username: 'admin', role: UserRole.ADMIN }),
  ],
  usergroups: [
    f.usergroup('Researchers', [{ refId: f.idString('self') }]),
    f.usergroup('Journalists', []),
  ],
};

const buildInput = (
  username: string,
  overrides?: Partial<{ role: UserRole; assignedGroupIds: string[] }>
) => ({
  _id: f.id(username).toString(),
  username,
  email: `${username}@provider.tld`,
  role: UserRole.EDITOR,
  ...overrides,
});

const createSut = (actor: User) =>
  testingEnvironment.runWithContext(() => UpdateUserUseCaseFactory.default(), { actor });

const actorFor = (username: string, role: string) =>
  User.createFrom({
    _id: new ObjectId(f.id(username).toString()),
    role,
    groups: [],
    username,
  });

const groupsOf = async (username: string) => {
  const groups = await testingEnvironment.db
    .getCollection('usergroups')!
    .find({ 'members.refId': f.idString(username) })
    .toArray();
  return groups.map(group => group.name).sort();
};

describe('UpdateUser', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should throw when the actor edits their own role', async () => {
    const sut = createSut(actorFor('self', 'editor'));

    await expect(sut.execute(buildInput('self', { role: UserRole.ADMIN }))).rejects.toThrow(
      'Cannot change own role'
    );
  });

  it('should allow the actor to edit their own profile when the role is unchanged', async () => {
    const sut = createSut(actorFor('self', 'editor'));

    const result = await sut.execute(buildInput('self', { role: UserRole.EDITOR }));

    expect(result.username).toBe('self');
  });

  it('should allow an admin to change another user role', async () => {
    const sut = createSut(actorFor('admin', 'admin'));

    const result = await sut.execute(buildInput('other', { role: UserRole.ADMIN }));

    expect(result.role).toBe(UserRole.ADMIN);
  });

  it('should throw when a non-admin edits someone else', async () => {
    const sut = createSut(actorFor('self', 'editor'));

    await expect(sut.execute(buildInput('other'))).rejects.toThrow(UnauthorizedError);
  });

  describe('group membership', () => {
    it('should not let a non-admin change their own groups', async () => {
      const sut = createSut(actorFor('self', 'editor'));

      await sut.execute(buildInput('self', { assignedGroupIds: [f.id('Journalists').toString()] }));

      expect(await groupsOf('self')).toEqual(['Researchers']);
    });

    it('should leave groups untouched when the update does not mention them', async () => {
      const sut = createSut(actorFor('admin', 'admin'));

      await sut.execute(buildInput('self'));

      expect(await groupsOf('self')).toEqual(['Researchers']);
    });

    it('should let an admin assign groups', async () => {
      const sut = createSut(actorFor('admin', 'admin'));

      await sut.execute(buildInput('self', { assignedGroupIds: [f.id('Journalists').toString()] }));

      expect(await groupsOf('self')).toEqual(['Journalists']);
    });

    it('should let an admin clear groups with an empty list', async () => {
      const sut = createSut(actorFor('admin', 'admin'));

      await sut.execute(buildInput('self', { assignedGroupIds: [] }));

      expect(await groupsOf('self')).toEqual([]);
    });
  });
});
