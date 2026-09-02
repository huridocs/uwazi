// @ts-expect-error passport ships no type declarations; passport_conf.js consumes it untyped
// too, and this spec drives the same registered chain.
import passport from 'passport';
import { UserRole } from '#api/core/domain/user/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { DBFixture } from '#api/utils/testing_db.js';
import '../passport_conf.js';

/**
 * The user deserialization produces goes into `appContext` and straight into
 * `permissionsContext`, whose `permissionsRefIds()` reads `user.groups[]._id.toString()` —
 * which is why deserialization uses `getProfile` and not `getById`.
 */

const f = getFixturesFactory();

const TENANT_ID = 'deserialize-user';

const fixtures: DBFixture = {
  users: [
    f.user({ username: 'member', role: UserRole.EDITOR, email: 'member@test.com' }),
    f.user({
      username: 'gone',
      role: UserRole.EDITOR,
      email: 'gone@test.com',
      deletedAt: new Date(),
    }),
  ],
  usergroups: [f.usergroup('Group A', [{ refId: f.idString('member') }])],
};

const deserialize = async (serialized: string): Promise<any> =>
  new Promise((resolve, reject) => {
    // Passport's Authenticator.deserializeUser doubles as registrar and invoker; called with
    // three arguments it runs the registered chain.
    (passport as any).deserializeUser(serialized, {}, (err: unknown, user: unknown) =>
      err ? reject(err) : resolve(user)
    );
  });

describe('passport deserializeUser', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    testingTenants.changeCurrentTenant({ name: TENANT_ID });

    await testingEnvironment.setFixtures(fixtures);
  });

  it('should resolve the session user with their groups and no password', async () => {
    const user = await deserialize(`${f.idString('member')}///${TENANT_ID}`);

    expect(user).toMatchObject({
      _id: expect.anything(),
      username: 'member',
      role: UserRole.EDITOR,
      email: 'member@test.com',
    });
    expect(user).not.toHaveProperty('password');
    expect(user.groups.map((group: { name: string }) => group.name)).toEqual(['Group A']);
  });

  it('should produce ids permissionsContext can turn into refIds', async () => {
    const user = await deserialize(`${f.idString('member')}///${TENANT_ID}`);

    // permissionsContext.permissionsRefIds() builds its list from
    // `user.groups[]._id.toString()` and `user._id.toString()`. GroupSummary._id is
    // already a string, so that call is a no-op — asserted rather than assumed, because a
    // silently empty refId list is a silent loss of access. (permissionsContext itself is
    // not exercised here: testingEnvironment mocks appContext.set to a no-op, so
    // setUserInContext would not take.)
    expect(user.groups.map((group: { _id: unknown }) => String(group._id))).toEqual([
      f.idString('Group A'),
    ]);
    expect(String(user._id)).toBe(f.idString('member'));
  });

  it.each([
    ['a soft-deleted user', () => f.idString('gone')],
    ['an unknown user', () => 'ffffffffffffffffffffffff'],
  ])('should refuse to establish a session for %s', async (_case, id) => {
    // Falsy, so passport treats the session as unauthenticated rather than throwing.
    expect(await deserialize(`${id()}///${TENANT_ID}`)).toBeFalsy();
  });

  it('should refuse a session serialized for another tenant', async () => {
    expect(await deserialize(`${f.idString('member')}///some-other-tenant`)).toBe(false);
  });
});
