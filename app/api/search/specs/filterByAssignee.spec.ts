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
      it('should return the entities that the selected user can read', async () => {
        userFactory.mock(users.adminUser);
        const query = {
          customFilters: { 'permissions.read': { values: [users.user1._id.toString()] } },
          includeUnpublished: true,
        };

        const { rows } = await search.search(query, 'es', users.adminUser);

        expect(rows.map((r: EntitySchema) => r.title)).toEqual(['ent1', 'ent2']);
      });

      it('should return the entities that the selected user can write', async () => {
        userFactory.mock(users.adminUser);
        const query = {
          customFilters: { 'permissions.write': { values: [users.user1._id.toString()] } },
          includeUnpublished: true,
        };

        const { rows } = await search.search(query, 'es', users.adminUser);

        expect(rows.map((r: EntitySchema) => r.title)).toEqual(['ent3']);
      });

      fit.each`
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
        level      | user
        ${'read'}  | ${undefined}
        ${'read'}  | ${users.editorUser}
        ${'read'}  | ${users.user1}
        ${'write'} | ${undefined}
        ${'write'} | ${users.editorUser}
        ${'write'} | ${users.user1}
      `('should ignore the filter', async ({ level, user }) => {
        userFactory.mock(user);
        const query = {
          customFilters: { [`permissions.${level}`]: { values: [users.user1._id.toString()] } },
          includeUnpublished: true,
        };

        const withFilter = await search.search(query, 'es', user);
        const noFilter = await search.search({ includeUnpublished: true }, 'es', user);

        expect(withFilter.rows.map((r: EntitySchema) => r.title)).toEqual(
          noFilter.rows.map((r: EntitySchema) => r.title)
        );
      });
    });
  });

  describe('aggregations', () => {
    const performSearch = async (user: UserSchema): Promise<AggregationBucket[][]> => {
      const response = await search.search(
        { aggregatePermissionsByUsers: true, includeUnpublished: true },
        'es',
        user
      );
      const aggs = response.aggregations as Aggregations;
      return [aggs.all.canread?.buckets, aggs.all.canwrite?.buckets];
    };

    it.each`
      allowed  | user
      ${false} | ${undefined}
      ${false} | ${users.editorUser}
      ${false} | ${users.user1}
      ${true}  | ${users.adminUser}
    `(
      'should return aggregations of permission level by users and groups',
      async ({ user, allowed }) => {
        userFactory.mock(user);
        const [canRead, canWrite] = await performSearch(user);

        if (!allowed) {
          expect(canRead).toBe(undefined);
          expect(canWrite).toBe(undefined);
        } else {
          expect(canRead.map(a => [a.key, a.filtered.doc_count])).toEqual(
            expect.arrayContaining([
              [users.user1._id.toString(), 2],
              [users.user2._id.toString(), 1],
              [users.user3._id.toString(), 0],
              [users.adminUser._id.toString(), 1],
              [users.editorUser._id.toString(), 1],
              [group1.toString(), 3],
              ['any', 6],
            ])
          );
          expect(canWrite.map(a => [a.key, a.filtered.doc_count])).toEqual(
            expect.arrayContaining([
              [users.user1._id.toString(), 1],
              [users.user2._id.toString(), 2],
              [users.user3._id.toString(), 3],
              [users.adminUser._id.toString(), 2],
              [users.editorUser._id.toString(), 1],
              [group1.toString(), 1],
              ['any', 6],
            ])
          );
        }
      }
    );
  });
});
