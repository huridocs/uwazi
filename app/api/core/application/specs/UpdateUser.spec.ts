import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { UpdateUserUseCaseFactory } from '#api/core/infrastructure/factories/UpdateUserUseCaseFactory.js';
import { UserRole } from '#api/core/domain/user/User.js';
import { User } from '#api/users.v2/model/User.js';
import { UnauthorizedError } from '#api/authorization.v2/errors/UnauthorizedError.js';
import { EmailInUse, UsernameExists } from '#api/core/domain/user/errors.js';

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

  describe('partial updates', () => {
    const storedUser = async (username: string) =>
      testingEnvironment.db
        .getCollection('users')!
        .findOne({ _id: f.id(username) }, { projection: { username: 1, email: 1, role: 1 } });

    it('should change only the email when only the email is given', async () => {
      const sut = createSut(actorFor('admin', 'admin'));

      await sut.execute({ _id: f.idString('other'), email: 'changed@provider.tld' });

      expect(await storedUser('other')).toMatchObject({
        username: 'other',
        email: 'changed@provider.tld',
        role: UserRole.COLLABORATOR,
      });
    });

    it('should change only the role when only the role is given', async () => {
      const sut = createSut(actorFor('admin', 'admin'));

      await sut.execute({ _id: f.idString('other'), role: UserRole.EDITOR });

      expect(await storedUser('other')).toMatchObject({
        username: 'other',
        email: 'other@provider.tld',
        role: UserRole.EDITOR,
      });
    });

    it('should leave the user as it was for an empty patch', async () => {
      const sut = createSut(actorFor('admin', 'admin'));

      await sut.execute({ _id: f.idString('other') });

      expect(await storedUser('other')).toMatchObject({
        username: 'other',
        email: 'other@provider.tld',
        role: UserRole.COLLABORATOR,
      });
    });

    it('should let users edit their own email without mentioning the role', async () => {
      const sut = createSut(actorFor('self', 'editor'));

      await sut.execute({ _id: f.idString('self'), email: 'me@provider.tld' });

      expect(await storedUser('self')).toMatchObject({ email: 'me@provider.tld', role: 'editor' });
    });

    it('should reject a username already taken by someone else', async () => {
      const sut = createSut(actorFor('admin', 'admin'));

      await expect(sut.execute({ _id: f.idString('self'), username: 'other' })).rejects.toThrow(
        UsernameExists
      );
    });

    it('should reject an email already taken by someone else', async () => {
      const sut = createSut(actorFor('admin', 'admin'));

      await expect(
        sut.execute({ _id: f.idString('self'), email: 'other@provider.tld' })
      ).rejects.toThrow(EmailInUse);
    });

    it('should reject an invalid patch through the domain rules', async () => {
      const sut = createSut(actorFor('admin', 'admin'));

      await expect(sut.execute({ _id: f.idString('other'), username: 'a b' })).rejects.toThrow(
        'Usernames can not contain spaces.'
      );
    });
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
