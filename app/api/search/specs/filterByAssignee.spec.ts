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
        'should return the entities that the selected user can $level',
        async ({ level, expected }) => {
          userFactory.mock(users.adminUser);
          const query = {
            customFilters: { [`permissions.${level}`]: { values: [users.user1._id.toString()] } },
            includeUnpublished: true,
          };

          const { rows } = await search.search(query, 'es', users.adminUser);

          expect(rows.map((r: EntitySchema) => r.title)).toEqual(expected);
        }
      );

      it.each`
        operator | expected
        ${'and'} | ${['ent1', 'ent2']}
        ${'or'}  | ${['ent1', 'ent2', 'ent3']}
      `('should accept the "$operator" operator', async ({ operator, expected }) => {
        userFactory.mock(users.adminUser);
        const query = {
          customFilters: {
            'permissions.read': {
              and: operator === 'and',
              values: [users.user1._id.toString(), group1.toString()],
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
              'permissions.read': { values: refIds.map((r: any) => r._id.toString()) },
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
            'permissions.read': { values: [users.editorUser._id.toString()] },
          },
          includeUnpublished: true,
        };

        const { rows } = await search.search(query, 'es');

        expect(rows.map((r: EntitySchema) => r.title)).toEqual(['entPublic1', 'entPublic2']);
      });
    });
  });

  describe('aggregations', () => {
    const performSearch = async (user?: UserSchema): Promise<AggregationBucket[][]> => {
      const response = await search.search(
        { aggregatePermissionsByUsers: true, includeUnpublished: true },
        'es',
        user
      );

      const aggs = response.aggregations as Aggregations;
      return [aggs.all['_permissions.read']?.buckets, aggs.all['_permissions.write']?.buckets];
    };

    it('should return aggregations of permission level by users and groups', async () => {
      userFactory.mock(users.adminUser);
      const [canRead, canWrite] = await performSearch(users.adminUser);

      expect(canRead.map(a => [a.key, a.filtered.doc_count, a.label, a.icon])).toEqual(
        expect.arrayContaining([
          [users.user1._id.toString(), 2, 'User 1', undefined],
          [users.user2._id.toString(), 1, 'User 2', undefined],
          [users.user3._id.toString(), 0, 'User 3', undefined],
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
      const [canRead, canWrite] = await performSearch(user3WithGroups);

      expect(canRead.map(a => [a.key, a.filtered.doc_count, a.label, a.icon])).toEqual(
        expect.arrayContaining([
          [users.user3._id.toString(), 0, 'User 3', undefined],
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
      const [canRead, canWrite] = await performSearch(undefined);

      expect(canRead).toBe(undefined);
      expect(canWrite).toBe(undefined);
    });
  });
});
