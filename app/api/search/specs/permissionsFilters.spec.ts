import db from 'api/utils/testing_db';
import { search } from 'api/search/search';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';

import { Aggregations, AggregationBucket } from 'shared/types/aggregations';
import { fixturesTimeOut } from './fixtures_elastic';
import { permissionsLevelFixtures, users, group1 } from './permissionsFiltersFixtures';

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

  describe('when selecting permissions', () => {
    describe('when user is admin/editor', () => {
      it.each([users.adminUser, users.editorUser])(
        'should return all permissions for the entity',
        async user => {
          userFactory.mock(user);
          const query = {
            include: ['permissions'],
            searchTerm: 'ent3 ent4',
          };

          const { rows } = await search.search(query, 'es');
          expect(rows[0].permissions).toEqual([
            { level: 'write', refId: users.user2._id.toString(), type: 'user' },
            { level: 'write', refId: users.user3._id.toString(), type: 'user' },
            { level: 'write', refId: group1.toString(), type: 'group' },
            { level: 'write', refId: users.adminUser._id.toString(), type: 'user' },
            { level: 'write', refId: users.editorUser._id.toString(), type: 'user' },
          ]);

          expect(rows[1].permissions).toEqual([
            { level: 'write', refId: users.user1._id.toString(), type: 'user' },
            { level: 'read', refId: users.user2._id.toString(), type: 'user' },
            { level: 'write', refId: users.user3._id.toString(), type: 'user' },
            { level: 'read', refId: group1.toString(), type: 'group' },
            { level: 'read', refId: users.adminUser._id.toString(), type: 'user' },
          ]);
        }
      );
    });

    describe('when user is a collaborator', () => {
      it('should return only allowed to see permissions', async () => {
        userFactory.mock(users.user2);
        const query = {
          include: ['permissions'],
        };

        const { rows } = await search.search(query, 'es');
        expect(rows).toEqual([
          expect.objectContaining({
            permissions: expect.arrayContaining([]),
          }),
          expect.objectContaining({
            permissions: expect.arrayContaining([
              { level: 'write', refId: users.user2._id.toString(), type: 'user' },
            ]),
          }),
        ]);
      });
    });
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

    it('should not return entities for wich the user does not have permissions', async () => {
      userFactory.mock(users.user2);
      const query = { searchTerm: 'ent1' };

      const { rows } = await search.search(query, 'es');
      expect(rows).toEqual([]);
    });

    describe('when filtering by permissions level', () => {
      it('should return only entitites that i can see and match the filter', async () => {
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

  describe('aggregations', () => {
    const performSearch = async (): Promise<AggregationBucket[]> => {
      const response = await search.search({ aggregatePermissionsByLevel: true }, 'es');
      const aggs = response.aggregations as Aggregations;
      return aggs.all.permissions.buckets;
    };

    it.each`
      user           | expect1 | expect2
      ${users.user1} | ${2}    | ${1}
      ${users.user2} | ${1}    | ${1}
    `(
      'should return aggregations of permission level filtered per current user',
      async ({ user, expect1, expect2 }) => {
        userFactory.mock(user);
        buckets = await performSearch();
        expect(buckets.find(a => a.key === 'read')?.filtered.doc_count).toBe(expect1);
        expect(buckets.find(a => a.key === 'write')?.filtered.doc_count).toBe(expect2);
      }
    );

    it('should return aggregations of permission level filtered per current users group', async () => {
      userFactory.mock({
        ...users.user3,
        groups: [{ _id: group1, name: 'group1' }],
      });

      buckets = await performSearch();
      expect(buckets.find(a => a.key === 'read')?.filtered.doc_count).toBe(3);
      expect(buckets.find(a => a.key === 'write')?.filtered.doc_count).toBe(2);
    });

    it('should also work when user is admin/editor', async () => {
      userFactory.mock(users.adminUser);
      buckets = await performSearch();
      expect(buckets.find(a => a.key === 'read')?.filtered.doc_count).toBe(1);
      expect(buckets.find(a => a.key === 'write')?.filtered.doc_count).toBe(2);

      userFactory.mock(users.editorUser);
      buckets = await performSearch();
      expect(buckets.find(a => a.key === 'read')?.filtered.doc_count).toBe(1);
      expect(buckets.find(a => a.key === 'write')?.filtered.doc_count).toBe(1);
    });
  });
});
