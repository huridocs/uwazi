import db from 'api/utils/testing_db';
import { search } from 'api/search/search';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';

import { Aggregations, AggregationBucket } from 'shared/types/Aggregations';
import { fixturesTimeOut } from './fixtures_elastic';
import { permissionsLevelFixtures, users, group1, group2 } from './permissionsFiltersFixtures';

describe('Permissions filters', () => {
  let buckets: AggregationBucket[];
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

    it('should not return entities for witch the user does not have permissions', async () => {
      userFactory.mock(users.user2);
      const query = { searchTerm: 'ent1' };

      const { rows } = await search.search(query, 'es');
      expect(rows).toEqual([]);
    });
  });

  describe('aggregations', () => {
    const performSearch = async (): Promise<AggregationBucket[]> => {
      const response = await search.search({ aggregatePermissionsByLevel: true }, 'es');
      const aggs = response.aggregations as Aggregations;
      return aggs.all.permissions.buckets;
    };

    it('should return aggregations of permission level filtered per current user', async () => {
      userFactory.mock(users.user1);
      buckets = await performSearch();
      expect(buckets.find(a => a.key === 'read')?.filtered.doc_count).toBe(2);
      expect(buckets.find(a => a.key === 'write')?.filtered.doc_count).toBe(1);

      userFactory.mock(users.user2);
      buckets = await performSearch();
      expect(buckets.find(a => a.key === 'read')?.filtered.doc_count).toBe(1);
      expect(buckets.find(a => a.key === 'write')?.filtered.doc_count).toBe(1);
    });

    it('should return aggregations of permission level filtered per current users group', async () => {
      userFactory.mock({
        ...users.user3,
        groups: [
          { _id: group1, name: 'group1' },
          { _id: group2, name: 'group2' },
        ],
      });

      buckets = await performSearch();
      expect(buckets.find(a => a.key === 'read')?.filtered.doc_count).toBe(3);
      expect(buckets.find(a => a.key === 'write')?.filtered.doc_count).toBe(2);
    });
  });
});
