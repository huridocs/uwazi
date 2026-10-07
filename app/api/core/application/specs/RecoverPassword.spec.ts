import { UserRole } from '#api/core/domain/user/User.js';
import { RecoverPasswordUseCaseFactory } from '#api/core/infrastructure/factories/RecoverPasswordUseCaseFactory.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

const f = getFixturesFactory();

const fixtures = {
  users: [
    f.user({ username: 'bob', role: UserRole.EDITOR, email: 'bob@test.com' }),
    f.user({
      username: 'gone',
      role: UserRole.EDITOR,
      email: 'gone@test.com',
      deletedAt: new Date(),
    }),
  ],
};

const createSut = () =>
  testingEnvironment.runWithContext(() => RecoverPasswordUseCaseFactory.default());

const recoveryEmailJobs = async () =>
  (await testingEnvironment.db.getAllFrom('jobs')).filter(
    job => job.name === 'SendPasswordRecoveryEmailHandler'
  );

describe('RecoverPassword', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should store a key and dispatch the recovery email for an active user', async () => {
    const output = await createSut().execute({ email: 'bob@test.com', domain: 'http://uwazi' });

    expect(output).toEqual({ recoveryEmailQueued: true });

    const recoveries = await testingEnvironment.db.getAllFrom('passwordrecoveries');
    expect(recoveries).toEqual([
      expect.objectContaining({ user: f.id('bob'), key: expect.any(String) }),
    ]);
    expect(await recoveryEmailJobs()).toEqual([
      expect.objectContaining({
        params: expect.objectContaining({
          userId: f.idString('bob'),
          domain: 'http://uwazi',
          key: recoveries[0].key,
        }),
      }),
    ]);
  });

  it('should do nothing and report it for an email no user has', async () => {
    const output = await createSut().execute({ email: 'nobody@test.com', domain: 'http://uwazi' });

    expect(output).toEqual({ recoveryEmailQueued: false });
    expect(await testingEnvironment.db.getAllFrom('passwordrecoveries')).toEqual([]);
    expect(await recoveryEmailJobs()).toEqual([]);
  });

  it('should treat a soft-deleted user as unknown', async () => {
    const output = await createSut().execute({ email: 'gone@test.com', domain: 'http://uwazi' });

    expect(output).toEqual({ recoveryEmailQueued: false });
    expect(await testingEnvironment.db.getAllFrom('passwordrecoveries')).toEqual([]);
    expect(await recoveryEmailJobs()).toEqual([]);
  });
});
