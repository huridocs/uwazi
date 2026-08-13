import { UsersQueryServiceFactory } from '#api/core/infrastructure/factories/UsersQueryServiceFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import {
  f,
  TENANT_ID,
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
 * The UsersQueryService contract suite (plan 04 step 2).
 *
 * Same harness and same fixture set as the UsersDirectory suite: one declaration, both
 * backends, expectations asserted as explicit literals so a field present on one backend
 * and absent on the other fails rather than passing quietly.
 *
 * The contract is one method (D3) — this is *the settings screen read*, and it is where
 * pagination and sorting will eventually land.
 */

const OTHER_TENANT_ID = 'other-tenant';

const profile = {
  active1: { ...view.active1, groups: [groupA, groupB], using2fa: false, accountLocked: false },
  active2: { ...view.active2, groups: [groupB], using2fa: false, accountLocked: false },
  sensitive: { ...view.sensitive, groups: [], using2fa: true, accountLocked: true },
};

describe('UsersQueryService', () => {
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

    const sut = () => testingEnvironment.runWithContext(() => UsersQueryServiceFactory.default());

    describe('listUsers()', () => {
      it('should return every active non-public user with their groups', async () => {
        // Sorted, not asserted in place: Mongo's aggregation and Postgres's unnest-and-join
        // share no natural order, and an incidental match here would become a flake later.
        const users = byUsername(await sut().listUsers()).map(withSortedGroups);

        expect(users).toEqual([profile.active1, profile.active2, profile.sensitive]);
      });

      it('should exclude soft-deleted and public users', async () => {
        const usernames = (await sut().listUsers()).map(user => user.username);

        expect(usernames).not.toContain('deleted');
        expect(usernames).not.toContain('public');
        expect(usernames).toHaveLength(3);
      });

      it('should return group objects of exactly { _id, name }', async () => {
        // Mongo's `$lookup` projection and Postgres's `jsonb_build_object` are two
        // independent chances to include an extra field.
        const users = await sut().listUsers();
        const groups = users.flatMap(user => user.groups);

        expect(groups).toHaveLength(3);
        groups.forEach(group => expect(Object.keys(group).sort()).toEqual(['_id', 'name']));
      });

      it('should return an empty group array, never undefined, for a user in no groups', async () => {
        const users = await sut().listUsers();
        const sensitive = users.find(user => user.username === 'sensitive');

        expect(sensitive!.groups).toEqual([]);
      });

      it('should coerce account state to booleans, never undefined', async () => {
        const users = await sut().listUsers();

        users.forEach(user => {
          expect(typeof user.using2fa).toBe('boolean');
          expect(typeof user.accountLocked).toBe('boolean');
        });

        // Both directions: absent in the fixture reads false, set reads true.
        const active1 = users.find(user => user.username === 'active1');
        const sensitive = users.find(user => user.username === 'sensitive');

        expect([active1!.using2fa, active1!.accountLocked]).toEqual([false, false]);
        expect([sensitive!.using2fa, sensitive!.accountLocked]).toEqual([true, true]);
      });

      it('should carry no credential fields', async () => {
        const users = await sut().listUsers();

        expect(users).toHaveLength(3);
        users.forEach(expectNoCredentials);
      });
    });
  });

  /**
   * Postgres only, and deliberately so. `findWithGroups` is the one read that bypasses the
   * query builder, so its tenant isolation rests entirely on RLS plus the defence-in-depth
   * `ug.tenant_id = u.tenant_id` correlation. This case lives here permanently rather than
   * in the DAO spec because it is a property of the contract, not of one query.
   *
   * Mongo has no equivalent: its tenancy is a whole separate database, which this harness
   * cannot straddle inside one suite.
   */
  describe('tenant isolation (Postgres)', () => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: TENANT_ID,
        featureFlags: { postgresUsers: true, postgresUsergroups: true },
      });

      await testingEnvironment.setFixtures(fixtures);

      // Seeded through the admin pool rather than testingPG.setFixtures, which truncates
      // each table it writes and would take the mirrored fixture with it. The foreign group
      // lists one of *our* users as a member, so a failure of either defence shows up as
      // this tenant's user gaining a group it never joined.
      const pool = testingEnvironment.pg.pool!;
      await pool.query(
        `INSERT INTO users ("_id", "tenant_id", "username", "password", "email", "role", "using2fa")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['intruder', OTHER_TENANT_ID, 'intruder', 'hash', 'intruder@other.com', 'admin', false]
      );
      await pool.query(
        'INSERT INTO usergroups ("_id", "tenant_id", "name", "members") VALUES ($1, $2, $3, $4)',
        [
          'other-group',
          OTHER_TENANT_ID,
          'Other Group',
          JSON.stringify(['intruder', f.idString('active1')]),
        ]
      );
    });

    const sut = () => testingEnvironment.runWithContext(() => UsersQueryServiceFactory.default());

    it('should never return another tenant users or their groups', async () => {
      // Guard against a vacuous pass: the admin pool bypasses RLS, so it must see the
      // foreign rows the assertions below expect the app user *not* to see.
      const seeded = await testingEnvironment.pg.getAllFrom('usergroups');
      expect(seeded.map(group => group.name)).toContain('Other Group');

      const users = byUsername(await sut().listUsers());

      expect(users.map(user => user.username)).toEqual(['active1', 'active2', 'sensitive']);
      expect(users.flatMap(user => user.groups.map(group => group.name))).not.toContain(
        'Other Group'
      );
    });
  });
});
