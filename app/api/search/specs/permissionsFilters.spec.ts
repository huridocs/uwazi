import db from 'api/utils/testing_db';
import { search } from 'api/search/search';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';

import { Aggregations, AggregationBucket } from 'shared/types/aggregations';
import { UserSchema } from 'shared/types/userType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { fixturesTimeOut } from './fixtures_elastic';
import {
  permissionsLevelFixtures,
  users,
  group1,
  template1Id,
  template2Id,
  template3Id,
} from './permissionsFiltersFixtures';

function getAggregationCountByType(typesBuckets: AggregationBucket[], templateId: ObjectIdSchema) {
  return typesBuckets.find(a => a.key === templateId.toString())?.filtered.doc_count;
}

// eslint-disable-next-line max-statements
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

  describe('when selecting permissions', () => {
    describe('when user is admin/editor', () => {
      it.each([users.adminUser, users.editorUser])(
        'should return all permissions for the entity',
        async user => {
          userFactory.mock(user);
          const query = {
            include: ['permissions'],
            searchTerm: 'ent3 ent4',
            unpublished: true,
          };

          const { rows } = await search.search(query, 'es', user);
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
          unpublished: true,
        };

        const { rows } = await search.search(query, 'es', users.user2);
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
      const query = { unpublished: true };

      const { rows } = await search.search(query, 'es', users.user2);
      expect(rows).toEqual([
        expect.objectContaining({ title: 'ent3' }),
        expect.objectContaining({ title: 'ent4' }),
      ]);
    });

    it('should not return entities for which the user does not have permissions', async () => {
      userFactory.mock(users.user2);
      const query = { searchTerm: 'ent1', unpublished: true };

      const { rows } = await search.search(query, 'es', users.user2);
      expect(rows).toEqual([]);
    });
  });

  describe('published aggregations based on access level ', () => {
    const performSearch = async (
      user: UserSchema,
      filters: { unpublished: boolean; includeUnpublished: boolean }
    ): Promise<AggregationBucket[]> => {
      const response = await search.search(
        { aggregatePublishingStatus: true, ...filters },
        'es',
        user
      );
      const aggs = response.aggregations as Aggregations;
      return aggs.all._published?.buckets;
    };

    it.each`
      user                | unpublished | includeUnpublished | published    | restricted
      ${users.adminUser}  | ${false}    | ${false}           | ${2}         | ${4}
      ${users.adminUser}  | ${true}     | ${false}           | ${2}         | ${4}
      ${users.editorUser} | ${true}     | ${false}           | ${2}         | ${4}
      ${users.user1}      | ${false}    | ${false}           | ${2}         | ${3}
      ${users.user1}      | ${true}     | ${false}           | ${2}         | ${3}
      ${users.user1}      | ${false}    | ${true}            | ${2}         | ${3}
      ${user3WithGroups}  | ${false}    | ${false}           | ${2}         | ${4}
      ${user3WithGroups}  | ${true}     | ${false}           | ${2}         | ${4}
      ${user3WithGroups}  | ${false}    | ${true}            | ${2}         | ${4}
      ${undefined}        | ${false}    | ${false}           | ${undefined} | ${undefined}
    `(
      'should return aggregations of publishing status filtered per current user',
      async ({ user, unpublished, includeUnpublished, published, restricted }) => {
        userFactory.mock(user);
        buckets = await performSearch(user, { unpublished, includeUnpublished });
        expect(buckets?.find(a => a.key === 'true')?.filtered.doc_count).toBe(published);
        expect(buckets?.find(a => a.key === 'false')?.filtered.doc_count).toBe(restricted);
      }
    );
  });

  describe('type aggregations based on read access to entities', () => {
    it.each`
      user                | template1Count | template2Count | template3Count
      ${users.user1}      | ${2}           | ${1}           | ${undefined}
      ${users.user2}      | ${1}           | ${undefined}   | ${1}
      ${user3WithGroups}  | ${2}           | ${1}           | ${1}
      ${users.editorUser} | ${2}           | ${1}           | ${1}
    `(
      'should return aggregations of matched entities having into account read permission',
      async ({ user, template1Count, template2Count, template3Count }) => {
        userFactory.mock(user);
        const response = await search.search({ unpublished: true }, 'es', user);
        const typesBuckets = (response.aggregations as Aggregations).all._types.buckets;
        expect(getAggregationCountByType(typesBuckets, template1Id)).toBe(template1Count);
        expect(getAggregationCountByType(typesBuckets, template2Id)).toBe(template2Count);
        expect(getAggregationCountByType(typesBuckets, template3Id)).toBe(template3Count);
      }
    );
  });

  describe('public entities', () => {
    describe('when query published and user is a collaborator/editor', () => {
      async function queryAndCheckOnlyPublished(query: {}) {
        const { rows, aggregations } = await search.search(query, 'es', users.user2);
        const typesBuckets = (aggregations as Aggregations).all._types.buckets;
        expect(rows).toEqual([
          expect.objectContaining({ title: 'entPublic1' }),
          expect.objectContaining({ title: 'entPublic2' }),
        ]);
        expect(getAggregationCountByType(typesBuckets, template1Id)).toBe(1);
        expect(getAggregationCountByType(typesBuckets, template3Id)).toBe(1);
      }

      it.each([users.user1, users.editorUser])('should see only public entities', async user => {
        userFactory.mock(user);
        const query = { published: true };
        await queryAndCheckOnlyPublished(query);
      });

      it.each([users.user1, users.editorUser])('should see only public entities', async user => {
        userFactory.mock(user);
        const query = { unpublished: false, includeUnpublished: false };
        await queryAndCheckOnlyPublished(query);
      });
    });

    describe('when query includeUnpublished and user is collaborator', () => {
      it('should see public and authorized entities', async () => {
        userFactory.mock(users.user2);
        const query = { includeUnpublished: true };
        const { rows, aggregations } = await search.search(query, 'es', users.user2);
        const typesBuckets = (aggregations as Aggregations).all._types.buckets;
        expect(rows).toEqual([
          expect.objectContaining({ title: 'ent3' }),
          expect.objectContaining({ title: 'ent4' }),
          expect.objectContaining({ title: 'entPublic1' }),
          expect.objectContaining({ title: 'entPublic2' }),
        ]);
        expect(getAggregationCountByType(typesBuckets, template1Id)).toBe(2);
        expect(getAggregationCountByType(typesBuckets, template3Id)).toBe(2);
      });
    });

    describe('when query includeUnpublished and user is editor/admin', () => {
      it.each([users.adminUser, users.editorUser])(
        'should see public and authorized entities',
        async user => {
          userFactory.mock(user);
          const query = { includeUnpublished: true };
          const { rows, aggregations } = await search.search(query, 'es', user);
          const typesBuckets = (aggregations as Aggregations).all._types.buckets;
          expect(rows).toEqual([
            expect.objectContaining({ title: 'ent1' }),
            expect.objectContaining({ title: 'ent2' }),
            expect.objectContaining({ title: 'ent3' }),
            expect.objectContaining({ title: 'ent4' }),
            expect.objectContaining({ title: 'entPublic1' }),
            expect.objectContaining({ title: 'entPublic2' }),
          ]);
          expect(getAggregationCountByType(typesBuckets, template1Id)).toBe(3);
          expect(getAggregationCountByType(typesBuckets, template3Id)).toBe(2);
        }
      );
    });
  });
});
