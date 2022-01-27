import db from 'api/utils/testing_db';
import { search } from 'api/search/search';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
import { AggregationBucket, Aggregations } from 'shared/types/aggregations';
import { UserSchema } from 'shared/types/userType';
import { fixturesTimeOut } from './fixtures_elastic';
import { permissionsLevelFixtures, users, group1 } from './permissionsFiltersFixtures';
import { EntitySchema } from '../../../shared/types/entityType';

describe('Permissions filters', () => {
  const userFactory = new UserInContextMockFactory();
  const user3WithGroups = { ...users.user3, groups: [{ _id: group1.toString(), name: 'Group1' }] };

  beforeAll(async () => {
    await db.setupFixturesAndContext(permissionsLevelFixtures, 'permissionsadminfilters');
    userFactory.restore();
  }, fixturesTimeOut);

  afterAll(async () => {
    await db.disconnect();
    userFactory.restore();
  });

  describe('filters', () => {
    describe('if logged as admin', () => {
      it.each`
        level      | expected
        ${'read'}  | ${['ent1', 'ent2']}
        ${'write'} | ${['ent3']}
      `(
        'should return the entities that the provided user can $level',
        async ({ level, expected }) => {
          userFactory.mock(users.adminUser);
          const query = {
            customFilters: {
              permissions: { values: [{ refId: users.user1._id.toString(), level }] },
            },
            includeUnpublished: true,
          };

          const { rows } = await search.search(query, 'es', users.adminUser);

          expect(rows.map((r: EntitySchema) => r.title)).toEqual(expected);
        }
      );

      it.each`
        operator | expected
        ${'and'} | ${['ent3']}
        ${'or'}  | ${['ent1', 'ent2', 'ent3']}
      `('should accept the "$operator" operator', async ({ operator, expected }) => {
        userFactory.mock(users.adminUser);
        const query = {
          customFilters: {
            permissions: {
              and: operator === 'and',
              values: [
                { refId: users.user1._id.toString(), level: 'write' },
                { refId: group1.toString(), level: 'read' },
              ],
            },
          },
          includeUnpublished: true,
        };

        const { rows } = await search.search(query, 'es', users.adminUser);

        expect(rows.map((r: EntitySchema) => r.title)).toEqual(expected);
      });
    });

    describe('if not logged as admin', () => {
      it.each`
        user                | refIds                                        | expected
        ${users.editorUser} | ${[users.editorUser, group1]}                 | ${['ent1']}
        ${user3WithGroups}  | ${[user3WithGroups, group1, users.adminUser]} | ${['ent1', 'ent2', 'ent3']}
      `(
        "should only allow the user's own refIds: $user.username",
        async ({ user, refIds, expected }) => {
          userFactory.mock(user);
          const query = {
            customFilters: {
              permissions: {
                values: refIds.map((r: any) => ({ refId: r._id.toString(), level: 'read' })),
              },
            },
            includeUnpublished: true,
          };

          const { rows } = await search.search(query, 'es', user);

          expect(rows.map((r: EntitySchema) => r.title)).toEqual(expected);
        }
      );
    });

    describe('if not logged in', () => {
      it('should ignore the filter', async () => {
        userFactory.mock(undefined);
        const query = {
          customFilters: {
            permissions: { values: [{ refId: users.editorUser._id.toString(), level: 'read' }] },
          },
          includeUnpublished: true,
        };

        const { rows } = await search.search(query, 'es');

        expect(rows.map((r: EntitySchema) => r.title)).toEqual(['entPublic1', 'entPublic2']);
      });
    });

    it('should not fail if no values provided', async () => {
      userFactory.mock(users.adminUser);
      let query: any = {
        customFilters: {
          permissions: { values: [] },
        },
      };

      await search.search(query, 'es', users.adminUser);

      query = {
        customFilters: {
          permissions: { and: true },
        },
      };

      await search.search(query, 'es', users.adminUser);
    });
  });

  describe('aggregations', () => {
    const performSearch = async (
      user: UserSchema | undefined,
      flags: string[],
      aggregationKeys: string[]
    ): Promise<AggregationBucket[][]> => {
      const response = await search.search(
        flags.reduce((params, flag) => ({ ...params, [flag]: true }), {}),
        'es',
        user
      );

      const aggs = response.aggregations as Aggregations;
      return aggregationKeys.map(key => aggs.all[key]?.buckets);
    };

    it('should return aggregations of permission level by users and groups', async () => {
      userFactory.mock(users.adminUser);
      const [canRead, canWrite] = await performSearch(
        users.adminUser,
        ['aggregatePermissionsByUsers', 'includeUnpublished'],
        ['_permissions.read', '_permissions.write']
      );

      expect(canRead.map(a => [a.key, a.filtered.doc_count, a.label, a.icon])).toEqual(
        expect.arrayContaining([
          [users.user1._id.toString(), 2, 'User 1', undefined],
          [users.user2._id.toString(), 1, 'User 2', undefined],
          [users.adminUser._id.toString(), 1, 'admin', undefined],
          [users.editorUser._id.toString(), 1, 'editor', undefined],
          [group1.toString(), 3, 'Group1', 'users'],
          ['any', 6, 'Any', undefined],
        ])
      );
      expect(canWrite.map(a => [a.key, a.filtered.doc_count, a.label, a.icon])).toEqual(
        expect.arrayContaining([
          [users.user1._id.toString(), 1, 'User 1', undefined],
          [users.user2._id.toString(), 2, 'User 2', undefined],
          [users.user3._id.toString(), 3, 'User 3', undefined],
          [users.adminUser._id.toString(), 2, 'admin', undefined],
          [users.editorUser._id.toString(), 1, 'editor', undefined],
          [group1.toString(), 1, 'Group1', 'users'],
          ['any', 6, 'Any', undefined],
        ])
      );
    });

    it('should only return aggregations for self and own groups', async () => {
      userFactory.mock(user3WithGroups);
      const [canRead, canWrite] = await performSearch(
        user3WithGroups,
        ['aggregatePermissionsByUsers', 'includeUnpublished'],
        ['_permissions.read', '_permissions.write']
      );

      expect(canRead.map(a => [a.key, a.filtered.doc_count, a.label, a.icon])).toEqual(
        expect.arrayContaining([
          [group1.toString(), 3, 'Group1', 'users'],
          ['any', 6, 'Any', undefined],
        ])
      );
      expect(canWrite.map(a => [a.key, a.filtered.doc_count, a.label, a.icon])).toEqual(
        expect.arrayContaining([
          [users.user3._id.toString(), 3, 'User 3', undefined],
          [group1.toString(), 1, 'Group1', 'users'],
          ['any', 6, 'Any', undefined],
        ])
      );
    });

    it('should not return aggregations to non-logged users', async () => {
      userFactory.mock(undefined);
      const [canRead, canWrite] = await performSearch(
        undefined,
        ['aggregatePermissionsByUsers', 'includeUnpublished'],
        ['_permissions.read', '_permissions.write']
      );

      expect(canRead).toBe(undefined);
      expect(canWrite).toBe(undefined);
    });

    describe('permissions aggregations based on users own access level ', () => {
      it.each`
        user                | expect1 | expect2
        ${users.user1}      | ${2}    | ${1}
        ${users.user2}      | ${1}    | ${1}
        ${user3WithGroups}  | ${3}    | ${2}
        ${users.adminUser}  | ${1}    | ${2}
        ${users.editorUser} | ${1}    | ${1}
      `(
        'should return aggregations of permission level filtered for user $user.username',
        async ({ user, expect1, expect2 }) => {
          userFactory.mock(user);
          const [buckets] = await performSearch(
            user,
            ['aggregatePermissionsByLevel', 'unpublished'],
            ['_permissions.self']
          );

          expect(buckets.find(a => a.key === 'read')?.filtered.doc_count).toBe(expect1);
          expect(buckets.find(a => a.key === 'write')?.filtered.doc_count).toBe(expect2);
        }
      );
    });
  });
});
