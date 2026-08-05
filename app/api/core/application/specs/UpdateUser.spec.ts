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
};

const buildInput = (username: string, overrides?: Partial<{ role: UserRole }>) => ({
  _id: f.id(username).toString(),
  username,
  email: `${username}@provider.tld`,
  role: UserRole.EDITOR,
  ...overrides,
});

const createSut = (actor: User) =>
  testingEnvironment.runWithContext(() => UpdateUserUseCaseFactory.default(), { actor });

describe('UpdateUser', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should throw when the actor edits their own role', async () => {
    const actor = User.createFrom({
      _id: new ObjectId(f.id('self').toString()),
      role: 'editor',
      groups: [],
      username: 'self',
    });
    const sut = createSut(actor);

    await expect(
      sut.execute(buildInput('self', { role: UserRole.ADMIN }))
    ).rejects.toThrow('Cannot change own role');
  });

  it('should allow the actor to edit their own profile when the role is unchanged', async () => {
    const actor = User.createFrom({
      _id: new ObjectId(f.id('self').toString()),
      role: 'editor',
      groups: [],
      username: 'self',
    });
    const sut = createSut(actor);

    const result = await sut.execute(buildInput('self', { role: UserRole.EDITOR }));

    expect(result.username).toBe('self');
  });

  it('should allow an admin to change another user role', async () => {
    const actor = User.createFrom({
      _id: new ObjectId(f.id('admin').toString()),
      role: 'admin',
      groups: [],
      username: 'admin',
    });
    const sut = createSut(actor);

    const result = await sut.execute(buildInput('other', { role: UserRole.ADMIN }));

    expect(result.role).toBe(UserRole.ADMIN);
  });

  it('should throw when a non-admin edits someone else', async () => {
    const actor = User.createFrom({
      _id: new ObjectId(f.id('self').toString()),
      role: 'editor',
      groups: [],
      username: 'self',
    });
    const sut = createSut(actor);

    await expect(sut.execute(buildInput('other'))).rejects.toThrow(UnauthorizedError);
  });
});
