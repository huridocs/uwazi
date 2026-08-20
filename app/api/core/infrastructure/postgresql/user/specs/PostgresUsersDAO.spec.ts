import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';
import { PostgresUsersDAO } from '../PostgresUsersDAO.js';
import type { UserScope } from '../UserReadOptions.js';

/**
 * What is left of this spec after plan 04 is what the contract suites cannot reach.
 *
 * Read projections and Mongo/Postgres parity moved to `application/specs/UsersDirectory`
 * and `application/specs/UsersQueryService`, where they are asserted once against both
 * backends. Parity is deliberately *not* asserted here: the two DAOs are private building
 * blocks and are not required to have matching signatures (D4).
 *
 * What stays is DAO-level policy, which no contract exercises:
 *   - the guard-uniformity table — every read applies the same two guards the same way,
 *     the property that used to be folklore (D5). `exists` and `count` have no contract
 *     caller at all, and no contract asks for a non-default scope except `getActor`.
 *   - the field-group table (D6). The contracts pin `identity` and `identity + status`;
 *     `credentials` and `security` belong to the write side.
 *   - the write path, including the guards that used to be missing from it.
 *   - two things unique to this backend: that an unknown condition key is rejected rather
 *     than interpolated, and that RLS scopes `raw()` statements directly. The end-to-end
 *     cross-tenant case now lives in the QueryService contract suite, but it cannot tell
 *     "RLS works" from "the defence-in-depth tenant correlation works" — this can.
 */

const TENANT_ID = 'test-tenant';
const OTHER_TENANT_ID = 'other-tenant';
const PUBLIC_ID = PUBLIC_USER_ID.toHexString();

const managerFor = (tenantId: string) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const makeDAO = (tenantId = TENANT_ID) =>
  new PostgresUsersDAO({ tenantId, pgTransactionManager: managerFor(tenantId) });

const userFixture = (overrides: Record<string, unknown>) => ({
  tenant_id: TENANT_ID,
  password: 'hash',
  role: 'editor',
  using2fa: false,
  ...overrides,
});

const groupFixture = (overrides: Record<string, unknown>) => ({
  tenant_id: TENANT_ID,
  ...overrides,
});

const SENSITIVE_COLUMNS = ['password', 'secret', 'failedLogins', 'accountUnlockCode'] as const;

const baseUsers = [
  userFixture({ _id: 'active1', username: 'active1', email: 'active1@test.com', role: 'admin' }),
  userFixture({ _id: 'active2', username: 'active2', email: 'active2@test.com' }),
  userFixture({
    _id: 'deleted1',
    username: 'deleted1',
    email: 'deleted1@test.com',
    deletedAt: new Date(),
  }),
  userFixture({ _id: PUBLIC_ID, username: 'public', email: 'public@uwazi.local' }),
  userFixture({
    _id: 'withsensitive',
    username: 'withsensitive',
    email: 'sensitive@test.com',
    secret: 'mysecret',
    failedLogins: 3,
    accountUnlockCode: 'abc123',
    accountLocked: true,
    using2fa: true,
  }),
];

const baseGroups = [
  groupFixture({ _id: 'groupA', name: 'Group A', members: ['active1'] }),
  groupFixture({ _id: 'groupB', name: 'Group B', members: ['active1', 'active2'] }),
];

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingPG.setFixtures({ users: baseUsers, usergroups: baseGroups });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresUsersDAO', () => {
  describe('guard uniformity', () => {
    type Probe = (dao: PostgresUsersDAO, id: string, scope?: UserScope) => Promise<boolean>;

    const readMethods: [string, Probe][] = [
      ['findOne', async (dao, _id, scope) => Boolean(await dao.findOne({ _id }, { scope }))],
      ['findMany', async (dao, _id, scope) => (await dao.findMany({ _id }, { scope })).length > 0],
      [
        'findWithGroups',
        async (dao, _id, scope) => (await dao.findWithGroups({ _id }, { scope })).length > 0,
      ],
      ['exists', async (dao, _id, scope) => dao.exists({ _id }, { scope })],
      ['count', async (dao, _id, scope) => (await dao.count({ _id }, { scope })) > 0],
    ];

    describe.each(readMethods)('%s', (_name, probe) => {
      it('should resolve an active user', async () => {
        expect(await probe(makeDAO(), 'active1')).toBe(true);
      });

      it('should exclude the soft-deleted user by default and resolve it when scoped in', async () => {
        expect(await probe(makeDAO(), 'deleted1')).toBe(false);
        expect(await probe(makeDAO(), 'deleted1', { deleted: 'include' })).toBe(true);
      });

      it('should exclude the system user by default and resolve it when scoped in', async () => {
        expect(await probe(makeDAO(), PUBLIC_ID)).toBe(false);
        expect(await probe(makeDAO(), PUBLIC_ID, { systemUser: 'include' })).toBe(true);
      });
    });

    it('should guard matchEmailOrUsername the same way', async () => {
      const dao = makeDAO();

      expect(await dao.matchEmailOrUsername('deleted1')).toEqual([]);
      expect(await dao.matchEmailOrUsername('public')).toEqual([]);
      expect((await dao.matchEmailOrUsername('active1')).map(u => u.username)).toEqual(['active1']);
    });
  });

  describe('field groups', () => {
    it('should select identity only by default', async () => {
      const user = await makeDAO().findOne({ _id: 'withsensitive' });

      expect(Object.keys(user!).sort()).toEqual(['_id', 'email', 'role', 'username']);
    });

    it.each([
      ['status' as const, ['accountLocked', 'using2fa']],
      ['credentials' as const, ['password']],
      ['security' as const, ['accountUnlockCode', 'failedLogins', 'secret']],
    ])('should add the %s group on request, keeping identity', async (group, added) => {
      const user = await makeDAO().findOne({ _id: 'withsensitive' }, { fields: [group] });

      expect(Object.keys(user!)).toEqual(
        expect.arrayContaining(['_id', 'username', 'role', 'email'])
      );
      added.forEach(column => expect(user).toHaveProperty(column));
    });

    it('should never return a sensitive column that was not asked for', async () => {
      const user = await makeDAO().findOne({ _id: 'withsensitive' }, { fields: ['status'] });

      SENSITIVE_COLUMNS.forEach(column => expect(user).not.toHaveProperty(column));
    });

    it('should apply field groups to findMany, findWithGroups and matchEmailOrUsername', async () => {
      const dao = makeDAO();
      const [many] = await dao.findMany({ _id: 'withsensitive' });
      const [joined] = await dao.findWithGroups({ _id: 'withsensitive' });
      const [matched] = await dao.matchEmailOrUsername('withsensitive');

      SENSITIVE_COLUMNS.forEach(column => {
        expect(many).not.toHaveProperty(column);
        expect(joined).not.toHaveProperty(column);
        expect(matched).not.toHaveProperty(column);
      });
    });
  });

  // matchEmailOrUsername's matching rules — exact, case-insensitive, on either column — are
  // asserted on both backends at once in application/specs/UsersDirectory.spec.ts, via
  // searchByUsernameOrEmail. Only its guards and field groups are exercised above.
  //
  // The same goes for findWithGroups's projection: group attachment, the empty array for a
  // user in no groups, and the exact { _id, name } shape live in
  // application/specs/UsersQueryService.spec.ts, along with the end-to-end cross-tenant case.

  describe('findWithGroups()', () => {
    it('should reject an unknown column in the condition rather than interpolate it', async () => {
      await expect(makeDAO().findWithGroups({ 'bogus"; DROP TABLE users; --': 1 })).rejects.toThrow(
        'unknown column'
      );
    });

    /**
     * findWithGroups is the one read that bypasses the query builder, so its tenant
     * isolation rests entirely on RLS — PostgresTable adds no tenant_id predicate to reads.
     *
     * This asserts RLS *directly*, on the same connection machinery `raw()` uses, because
     * the end-to-end case — now in application/specs/UsersQueryService.spec.ts — cannot
     * distinguish "RLS works" from "the defence-in-depth ug.tenant_id = u.tenant_id
     * correlation works". Both matter; only one is load-bearing.
     */
    it('should have RLS scope raw statements on both tables', async () => {
      await testingPG.setFixtures({
        users: [
          ...baseUsers,
          {
            tenant_id: OTHER_TENANT_ID,
            _id: 'intruder',
            username: 'intruder',
            email: 'intruder@other.com',
            password: 'hash',
            role: 'admin',
            using2fa: false,
          },
        ],
        usergroups: [
          ...baseGroups,
          { tenant_id: OTHER_TENANT_ID, _id: 'otherGroup', name: 'Other Group', members: [] },
        ],
      });

      const seen = await managerFor(TENANT_ID).withConnection(async trx => ({
        users: await trx.raw('SELECT "_id" FROM users'),
        groups: await trx.raw('SELECT "_id" FROM usergroups'),
      }));

      expect(seen.users.rows.map((row: { _id: string }) => row._id)).not.toContain('intruder');
      expect(seen.groups.rows.map((row: { _id: string }) => row._id)).not.toContain('otherGroup');
      expect(seen.groups.rows).toHaveLength(2);
    });
  });

  describe('writes', () => {
    it('should insert a user', async () => {
      await makeDAO().insertOne({
        _id: 'inserted',
        username: 'inserted',
        email: 'inserted@test.com',
        role: 'editor',
        password: 'hash',
        using2fa: false,
      });

      expect(await makeDAO().findOne({ _id: 'inserted' })).toBeDefined();
    });

    it('should update a user', async () => {
      await makeDAO().updateOne({ _id: 'active1' }, { username: 'renamed' });

      expect((await makeDAO().findOne({ _id: 'active1' }))?.username).toBe('renamed');
    });

    it('should refuse to update a guarded user by default', async () => {
      await makeDAO().updateOne({ _id: PUBLIC_ID }, { username: 'hijacked' });

      const publicUser = await makeDAO().findOne(
        { _id: PUBLIC_ID },
        { scope: { systemUser: 'include' } }
      );
      expect(publicUser?.username).toBe('public');
    });

    it('should soft-delete users', async () => {
      expect(await makeDAO().delete(['active1'])).toBe(1);
      expect(await makeDAO().findOne({ _id: 'active1' })).toBeUndefined();
    });

    it('should refuse to soft-delete the system user', async () => {
      // The previous implementation guarded nothing here.
      expect(await makeDAO().delete([PUBLIC_ID])).toBe(0);
    });

    it('should return 0 for an empty id list without touching the database', async () => {
      expect(await makeDAO().delete([])).toBe(0);
    });
  });
});
