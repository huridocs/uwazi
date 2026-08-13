import { ObjectId } from 'mongodb';
import { PUBLIC_USER_ID, UserRole } from '#api/core/domain/user/User.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoUsersDAO } from '../MongoUsersDAO.js';
import type { UserScope } from '../UserReadOptions.js';
import { fixtures, factory, withsensitiveId } from './fixtures.js';

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
 */

const getDao = () =>
  testingEnvironment.runWithContext(
    () =>
      new MongoUsersDAO({
        db: getConnection(),
        transactionManager: TransactionManagerFactory.default(),
      })
  );

const activeId = factory.id('active1');
const deletedId = factory.id('deleted');

const SENSITIVE_FIELDS = ['password', 'secret', 'failedLogins', 'accountUnlockCode'] as const;

describe('MongoUsersDAO', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('guard uniformity', () => {
    type Probe = (dao: MongoUsersDAO, id: ObjectId, scope?: UserScope) => Promise<boolean>;

    const readMethods: [string, Probe][] = [
      ['findOne', async (dao, id, scope) => Boolean(await dao.findOne({ _id: id }, { scope }))],
      [
        'findMany',
        async (dao, id, scope) => (await dao.findMany({ _id: id }, { scope })).length > 0,
      ],
      [
        'findWithGroups',
        async (dao, id, scope) => (await dao.findWithGroups({ _id: id }, { scope })).length > 0,
      ],
      ['exists', async (dao, id, scope) => dao.exists({ _id: id }, { scope })],
      ['count', async (dao, id, scope) => (await dao.count({ _id: id }, { scope })) > 0],
    ];

    describe.each(readMethods)('%s', (_name, probe) => {
      it('should resolve an active user', async () => {
        expect(await probe(getDao(), activeId)).toBe(true);
      });

      it('should exclude the soft-deleted user by default and resolve it when scoped in', async () => {
        expect(await probe(getDao(), deletedId)).toBe(false);
        expect(await probe(getDao(), deletedId, { deleted: 'include' })).toBe(true);
      });

      it('should exclude the system user by default and resolve it when scoped in', async () => {
        expect(await probe(getDao(), PUBLIC_USER_ID)).toBe(false);
        expect(await probe(getDao(), PUBLIC_USER_ID, { systemUser: 'include' })).toBe(true);
      });
    });

    it('should not let the system-user guard clobber a caller filter on the same field', async () => {
      // The guard constrains `_id`; so does this filter. Merged by spread rather than
      // $and, the guard would win and this would return some other user entirely.
      const user = await getDao().findOne({ _id: activeId });

      expect(user?._id).toEqual(activeId);
    });
  });

  describe('field groups', () => {
    it('should project identity only by default', async () => {
      const user = await getDao().findOne({ _id: withsensitiveId });

      expect(Object.keys(user!).sort()).toEqual(['_id', 'email', 'role', 'username']);
    });

    it.each([
      ['status' as const, ['accountLocked', 'using2fa']],
      ['credentials' as const, ['password']],
      ['security' as const, ['accountUnlockCode', 'failedLogins', 'secret']],
    ])('should add the %s group on request, keeping identity', async (group, added) => {
      const user = await getDao().findOne({ _id: withsensitiveId }, { fields: [group] });

      expect(Object.keys(user!)).toEqual(
        expect.arrayContaining(['_id', 'username', 'role', 'email'])
      );
      added.forEach(field => expect(user).toHaveProperty(field));
    });

    it('should never return a sensitive field that was not asked for', async () => {
      const user = await getDao().findOne({ _id: withsensitiveId }, { fields: ['status'] });

      SENSITIVE_FIELDS.forEach(field => expect(user).not.toHaveProperty(field));
    });

    it('should apply field groups to findMany and findWithGroups too', async () => {
      const [many] = await getDao().findMany({ _id: withsensitiveId });
      const [joined] = await getDao().findWithGroups({ _id: withsensitiveId });

      SENSITIVE_FIELDS.forEach(field => {
        expect(many).not.toHaveProperty(field);
        expect(joined).not.toHaveProperty(field);
      });
    });
  });

  // findWithGroups's projection — group attachment, the empty array for a user in no
  // groups, and the exact { _id, name } shape — is asserted on both backends at once in
  // application/specs/UsersQueryService.spec.ts. Only its guard and field-group behaviour
  // is exercised above, where it belongs.

  describe('writes', () => {
    it('should insert a user', async () => {
      const _id = new ObjectId();
      await getDao().insertOne({
        _id,
        username: 'inserted',
        role: UserRole.EDITOR,
        email: 'inserted@test.com',
      });

      expect(await getDao().findOne({ _id })).not.toBeNull();
    });

    it('should update a user', async () => {
      await getDao().updateOne({ _id: activeId }, { $set: { username: 'renamed' } });

      expect((await getDao().findOne({ _id: activeId }))?.username).toBe('renamed');
    });

    it('should refuse to update a guarded user by default', async () => {
      await getDao().updateOne({ _id: PUBLIC_USER_ID }, { $set: { username: 'hijacked' } });

      const publicUser = await getDao().findOne(
        { _id: PUBLIC_USER_ID },
        { scope: { systemUser: 'include' } }
      );
      expect(publicUser?.username).toBe('public');
    });

    it('should soft-delete users', async () => {
      const deleted = await getDao().softDelete([activeId.toHexString()]);

      expect(deleted).toBe(1);
      expect(await getDao().findOne({ _id: activeId })).toBeNull();
    });

    it('should refuse to soft-delete the system user', async () => {
      // The previous implementation guarded nothing here.
      expect(await getDao().softDelete([PUBLIC_USER_ID.toHexString()])).toBe(0);
    });

    it('should return 0 for an empty id list without touching the database', async () => {
      expect(await getDao().softDelete([])).toBe(0);
    });
  });
});
