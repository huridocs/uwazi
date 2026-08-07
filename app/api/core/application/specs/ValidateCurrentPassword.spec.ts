import { encryptPassword } from '#api/auth/encryptPassword.js';
import { UsersDAOFactory } from '#api/core/infrastructure/factories/UsersDAOFactory.js';
import { MongoUsersDataSource } from '#api/core/infrastructure/mongodb/user/MongoUsersDataSource.js';
import { UserRole } from '#api/core/domain/user/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ValidateCurrentPassword } from '../ValidateCurrentPassword.js';

const f = getFixturesFactory();

let bcryptPassword: string;

const buildFixtures = async () => {
  bcryptPassword = await encryptPassword('validpassword');

  return {
    users: [f.user({ username: 'validuser', role: UserRole.EDITOR, password: bcryptPassword })],
  };
};

const createSut = () => {
  const usersDS = new MongoUsersDataSource({ dao: UsersDAOFactory.default() });
  return new ValidateCurrentPassword({ usersDS }, { tenant: {} as any });
};

describe('ValidateCurrentPassword', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(await buildFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should return true when the submitted password matches', async () => {
    const sut = createSut();

    const result = await sut.execute({
      username: 'validuser',
      submittedPassword: 'validpassword',
    });

    expect(result).toBe(true);
  });

  it('should return false when the submitted password does not match', async () => {
    const sut = createSut();

    const result = await sut.execute({
      username: 'validuser',
      submittedPassword: 'wrongpassword',
    });

    expect(result).toBe(false);
  });

  it('should return false when the username does not exist', async () => {
    const sut = createSut();

    const result = await sut.execute({
      username: 'nobody',
      submittedPassword: 'validpassword',
    });

    expect(result).toBe(false);
  });
});
