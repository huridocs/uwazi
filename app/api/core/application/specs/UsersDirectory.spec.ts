import { PUBLIC_USER_ID, UserRole } from '#api/core/domain/user/User.js';
import { UserNotFound } from '#api/core/domain/user/errors.js';
import { UsersDirectoryFactory } from '#api/core/infrastructure/factories/UsersDirectoryFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import {
  f,
  TENANT_ID,
  UNKNOWN_ID,
  MALFORMED_ID,
  fixtures,
  view,
  groupA,
  groupB,
  byUsername,
  withSortedGroups,
  expectNoCredentials,
  testConfigs,
} from './UsersContractFixtures.js';

/**
 * The UsersDirectory contract suite (plan 04 step 1).
 *
 * One suite, two backends, one fixture declaration — `setFixtures` mirrors `users` and
 * `usergroups` into Postgres. Every case below runs identically on both, which is what
 * makes it a parity proof rather than two per-implementation specs that can drift: the
 * expectations are explicit literals, asserted with `toEqual` rather than
 * `objectContaining`, so a field present on one backend and absent on the other fails.
 *
 * It exercises the contract only. Guard uniformity across DAO methods (D5), field groups
 * (D6) and the write path stay in the per-backend DAO specs — the contract cannot reach
 * them.
 */

describe('UsersDirectory', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: TENANT_ID,
        featureFlags: { postgresUsers: usePostgres, postgresUsergroups: usePostgres },
      });

      await testingEnvironment.setFixtures(fixtures);
    });

    const sut = () => testingEnvironment.runWithContext(() => UsersDirectoryFactory.default());

    describe('getById()', () => {
      it('should return the identity of an active user and nothing else', async () => {
        const result = await sut().getById(f.idString('active1'));

        expect(result.isOk()).toBe(true);
        expect(result.getDataOrThrow()).toEqual(view.active1);
      });

      it.each([
        ['a soft-deleted user', () => f.idString('deleted')],
        ['the public user', () => PUBLIC_USER_ID.toHexString()],
        ['an unknown id', () => UNKNOWN_ID],
        ['a malformed id', () => MALFORMED_ID],
      ])('should not resolve %s', async (_case, id) => {
        const result = await sut().getById(id());

        expect(result.isError()).toBe(true);
        expect(result.getError()).toBeInstanceOf(UserNotFound);
      });
    });

    describe('getProfile()', () => {
      it('should carry account state and every group the user belongs to', async () => {
        const result = await sut().getProfile(f.idString('active1'));

        expect(withSortedGroups(result.getDataOrThrow()!)).toEqual({
          ...view.active1,
          groups: [groupA, groupB],
          using2fa: false,
          accountLocked: false,
        });
      });

      it('should carry a single group without collapsing it', async () => {
        const result = await sut().getProfile(f.idString('active2'));

        expect(result.getDataOrThrow()).toEqual({
          ...view.active2,
          groups: [groupB],
          using2fa: false,
          accountLocked: false,
        });
      });

      it('should return an empty group array, never undefined, for a user in no groups', async () => {
        const result = await sut().getProfile(f.idString('sensitive'));
        const profile = result.getDataOrThrow()!;

        expect(profile.groups).toEqual([]);
        expect(profile).toEqual({
          ...view.sensitive,
          groups: [],
          using2fa: true,
          accountLocked: true,
        });
      });

      it.each([
        ['a soft-deleted user', () => f.idString('deleted')],
        ['the public user', () => PUBLIC_USER_ID.toHexString()],
        ['an unknown id', () => UNKNOWN_ID],
      ])('should not resolve %s', async (_case, id) => {
        const result = await sut().getProfile(id());

        expect(result.isError()).toBe(true);
        expect(result.getError()).toBeInstanceOf(UserNotFound);
      });
    });

    describe('getActor()', () => {
      it('should resolve a soft-deleted user — the only method that does — with their groups', async () => {
        const result = await sut().getActor(f.idString('deleted'));

        expect(result.isOk()).toBe(true);
        expect(result.getDataOrThrow()).toEqual({
          ...view.deleted,
          groups: [groupB],
          using2fa: false,
          accountLocked: false,
        });
      });

      it('should agree with getProfile on an active user', async () => {
        const directory = sut();
        const actor = await directory.getActor(f.idString('active1'));
        const profile = await directory.getProfile(f.idString('active1'));

        expect(withSortedGroups(actor.getDataOrThrow()!)).toEqual(
          withSortedGroups(profile.getDataOrThrow()!)
        );
      });

      it.each([
        ['the public user', () => PUBLIC_USER_ID.toHexString()],
        ['an unknown id', () => UNKNOWN_ID],
        ['a malformed id', () => MALFORMED_ID],
      ])('should still refuse %s', async (_case, id) => {
        const result = await sut().getActor(id());

        expect(result.isError()).toBe(true);
        expect(result.getError()).toBeInstanceOf(UserNotFound);
      });
    });

    describe('getPublicUser()', () => {
      it('should resolve the system user — the only method that does — as a profile', async () => {
        const result = await sut().getPublicUser();

        expect(result.isOk()).toBe(true);
        expect(result.getDataOrThrow()).toEqual({
          _id: PUBLIC_USER_ID.toHexString(),
          username: 'public',
          role: UserRole.COLLABORATOR,
          email: 'public@uwazi.local',
          groups: [],
          using2fa: false,
          accountLocked: false,
        });
      });

      it('should not carry credentials', async () => {
        const result = await sut().getPublicUser();

        expectNoCredentials(result.getDataOrThrow()!);
      });

      it('should fail with UserNotFound when the public user was never seeded', async () => {
        await testingEnvironment.setFixtures({
          ...fixtures,
          users: (fixtures.users ?? []).filter(user => !PUBLIC_USER_ID.equals(user._id)),
        });

        const result = await sut().getPublicUser();

        expect(result.isError()).toBe(true);
        expect(result.getError()).toBeInstanceOf(UserNotFound);
      });
    });

    describe('getManyByIds()', () => {
      it('should return the identities asked for', async () => {
        const users = await sut().getManyByIds([f.idString('active1'), f.idString('active2')]);

        expect(byUsername(users)).toEqual([view.active1, view.active2]);
      });

      it('should filter out soft-deleted and public users (D9)', async () => {
        const users = await sut().getManyByIds([
          f.idString('active1'),
          f.idString('deleted'),
          PUBLIC_USER_ID.toHexString(),
        ]);

        expect(users).toEqual([view.active1]);
      });

      it('should ignore unknown and malformed ids rather than failing the batch', async () => {
        const users = await sut().getManyByIds([UNKNOWN_ID, f.idString('active1'), MALFORMED_ID]);

        expect(users).toEqual([view.active1]);
      });

      it('should return an empty array for an empty request', async () => {
        expect(await sut().getManyByIds([])).toEqual([]);
      });
    });

    describe('searchByUsernameOrEmail()', () => {
      it('should match a username exactly, case-insensitively', async () => {
        expect(await sut().searchByUsernameOrEmail('ACTIVE1')).toEqual([view.active1]);
      });

      it('should match an email exactly, case-insensitively', async () => {
        expect(await sut().searchByUsernameOrEmail('ACTIVE2@TEST.COM')).toEqual([view.active2]);
      });

      it('should not match a prefix', async () => {
        expect(await sut().searchByUsernameOrEmail('active')).toEqual([]);
      });

      it('should treat regex metacharacters literally', async () => {
        // `^.*$` matches every user; `.*` matches no username. This is what escapeRegExp
        // buys on the Mongo side and what `lower(?)` gives for free on Postgres — without
        // it the two backends disagree, loudly, right here.
        expect(await sut().searchByUsernameOrEmail('.*')).toEqual([]);
        expect(await sut().searchByUsernameOrEmail('a.b*')).toEqual([]);
      });

      it.each([
        ['a soft-deleted user', 'deleted'],
        ['the public user', 'public'],
        ['nothing at all', 'nonexistent'],
      ])('should return an empty array for %s', async (_case, term) => {
        expect(await sut().searchByUsernameOrEmail(term)).toEqual([]);
      });
    });

    describe('list()', () => {
      it('should return every active user, excluding the deleted and the public one', async () => {
        const users = await sut().list();

        expect(byUsername(users)).toEqual([view.active1, view.active2, view.sensitive]);
      });
    });

    describe('credential fields', () => {
      it('should be absent from every read model the contract returns', async () => {
        const directory = sut();

        const models = [
          (await directory.getById(f.idString('sensitive'))).getDataOrThrow(),
          (await directory.getProfile(f.idString('sensitive'))).getDataOrThrow(),
          // The deleted user, through the one method that sees them: it may name them, it
          // may not disclose `deletedAt`.
          (await directory.getActor(f.idString('deleted'))).getDataOrThrow(),
          ...(await directory.getManyByIds([f.idString('sensitive')])),
          ...(await directory.searchByUsernameOrEmail('sensitive')),
          ...(await directory.list()),
        ];

        // getById + getProfile + getActor + getManyByIds + searchByUsernameOrEmail + list's
        // three. Pinned so an empty result can never make the loop below vacuously pass.
        expect(models).toHaveLength(8);
        models.forEach(model => expectNoCredentials(model!));
      });
    });
  });
});
