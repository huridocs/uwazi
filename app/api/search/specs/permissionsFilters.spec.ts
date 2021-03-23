import db from 'api/utils/testing_db';
import { search } from 'api/search/search';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';

import { Aggregations, AggregationBucket } from 'shared/types/aggregations';
import { fixturesTimeOut } from './fixtures_elastic';
import {
  permissionsLevelFixtures,
  users,
  group1,
  template1Id,
  template2Id,
  template3Id,
} from './permissionsFiltersFixtures';

describe('Permissions filters', () => {
  let buckets: AggregationBucket[];

  const user3WithGroups = { ...users.user3, groups: [{ _id: group1.toString() }] };

  const userFactory = new UserInContextMockFactory();

  beforeAll(async () => {
    await db.setupFixturesAndContext(permissionsLevelFixtures, 'permissionslevelfixtures');
    userFactory.restore();
  }, fixturesTimeOut);

  afterAll(async () => {
    await db.disconnect();
    userFactory.restore();
  });

  describe('filters', () => {
    it('should return results based on what the user is allowed to see', async () => {
      userFactory.mock(users.user2);
      const query = {};

      const { rows } = await search.search(query, 'es');
      expect(rows).toEqual([
        expect.objectContaining({ title: 'ent3' }),
        expect.objectContaining({ title: 'ent4' }),
      ]);
    });

    it('should not return entities for which the user does not have permissions', async () => {
      userFactory.mock(users.user2);
      const query = { searchTerm: 'ent1' };

      const { rows } = await search.search(query, 'es');
      expect(rows).toEqual([]);
    });

    describe('when filtering by permissions level', () => {
      it('should return only entities that I can see and match the filter', async () => {
        userFactory.mock(users.user2);
        const query = {
          customFilters: { 'permissions.level': { values: ['write'] } },
        };

        const { rows } = await search.search(query, 'es');
        expect(rows).toEqual([expect.objectContaining({ title: 'ent4' })]);
      });

      it('should return entities that admin/editor have explicit permissions', async () => {
        userFactory.mock(users.adminUser);
        const query = {
          customFilters: { 'permissions.level': { values: ['write'] } },
        };

        const { rows: adminRows } = await search.search(query, 'es');
        expect(adminRows).toEqual([
          expect.objectContaining({ title: 'ent2' }),
          expect.objectContaining({ title: 'ent4' }),
        ]);

        userFactory.mock(users.editorUser);
        const { rows: editorRows } = await search.search(query, 'es');
        expect(editorRows).toEqual([expect.objectContaining({ title: 'ent4' })]);
      });
    });
  });

  describe('permissions aggregations based on access level ', () => {
    const performSearch = async (): Promise<AggregationBucket[]> => {
      const response = await search.search({ aggregatePermissionsByLevel: true }, 'es');
      const aggs = response.aggregations as Aggregations;
      return aggs.all.permissions.buckets;
    };

    it.each`
      user                | expect1 | expect2
      ${users.user1}      | ${2}    | ${1}
      ${users.user2}      | ${1}    | ${1}
      ${user3WithGroups}  | ${3}    | ${2}
      ${users.adminUser}  | ${1}    | ${2}
      ${users.editorUser} | ${1}    | ${1}
    `(
      'should return aggregations of permission level filtered per current user',
      async ({ user, expect1, expect2 }) => {
        userFactory.mock(user);
        buckets = await performSearch();
        expect(buckets.find(a => a.key === 'read')?.filtered.doc_count).toBe(expect1);
        expect(buckets.find(a => a.key === 'write')?.filtered.doc_count).toBe(expect2);
      }
    );
  });

  describe('type aggregations based on read access to entities', () => {
    it.each`
      user                | template1Count | template2Count | template3Count
      ${users.user1}      | ${2}           | ${1}           | ${0}
      ${users.user2}      | ${1}           | ${0}           | ${1}
      ${user3WithGroups}  | ${2}           | ${1}           | ${1}
      ${users.editorUser} | ${2}           | ${1}           | ${1}
    `(
      'should return aggregations of matched entities having into account read permission',
      async ({ user, template1Count, template2Count, template3Count }) => {
        userFactory.mock(user);
        const response = await search.search({}, 'es');
        const typesBuckets = (response.aggregations as Aggregations).all._types.buckets;

        expect(typesBuckets.find(a => a.key === template1Id.toString())?.filtered.doc_count).toBe(
          template1Count
        );
        expect(typesBuckets.find(a => a.key === template2Id.toString())?.filtered.doc_count).toBe(
          template2Count
        );
        expect(typesBuckets.find(a => a.key === template3Id.toString())?.filtered.doc_count).toBe(
          template3Count
        );
      }
    );
  });
});
