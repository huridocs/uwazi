import db from 'api/utils/testing_db';
import { search } from 'api/search/search';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';

import { fixturesTimeOut } from './fixtures_elastic';
import { permissionsLevelFixtures, users, group1, group2 } from './permissionsLevelFixtures';

describe('Permissions aggregations', () => {
  let response;
  let aggregations;
  const userFactory = new UserInContextMockFactory();

  beforeAll(async () => {
    await db.setupFixturesAndContext(permissionsLevelFixtures, 'permissionslevelfixtures');
    userFactory.restore();
  }, fixturesTimeOut);

  afterAll(async () => {
    await db.disconnect();
    userFactory.restore();
  });

  it('should return aggregations of permission level filtered per current user', async () => {
    userFactory.mock(users.user1);
    response = await search.search({ permissionsByLevel: true }, 'es');
    aggregations = response.aggregations.all.permissions.buckets;
    expect(aggregations.find(a => a.key === 'read').filtered.doc_count).toBe(2);
    expect(aggregations.find(a => a.key === 'write').filtered.doc_count).toBe(1);

    userFactory.mock(users.user2);
    response = await search.search({ permissionsByLevel: true }, 'es');
    aggregations = response.aggregations.all.permissions.buckets;
    expect(aggregations.find(a => a.key === 'read').filtered.doc_count).toBe(1);
    expect(aggregations.find(a => a.key === 'write').filtered.doc_count).toBe(0);
  });

  it('should return aggregations of permission level filtered per current users group', async () => {
    userFactory.mock({ _id: users.user3._id, groups: [{ _id: group1 }, { _id: group2 }] });

    response = await search.search({ permissionsByLevel: true }, 'es');
    aggregations = response.aggregations.all.permissions.buckets;
    expect(aggregations.find(a => a.key === 'read').filtered.doc_count).toBe(2);
    expect(aggregations.find(a => a.key === 'write').filtered.doc_count).toBe(2);
  });
});
