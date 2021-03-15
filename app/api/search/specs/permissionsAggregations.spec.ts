import db from 'api/utils/testing_db';
import { search } from 'api/search/search';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';

import { fixturesTimeOut } from './fixtures_elastic';
import { permissionsLevelFixtures, user1, group1, group2 } from './permissionsLevelFixtures';

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
    userFactory.mock({ _id: 'User2' });

    response = await search.search({ permissionsByLevel: true }, 'es');
    aggregations = response.aggregations.all.permissions.buckets;
    expect(aggregations.find(a => a.key === 'read').filtered.doc_count).toBe(1);
    expect(aggregations.find(a => a.key === 'write').filtered.doc_count).toBe(0);

    userFactory.mock({ _id: 'User1' });
    response = await search.search({ permissionsByLevel: true }, 'es');
    aggregations = response.aggregations.all.permissions.buckets;
    expect(aggregations.find(a => a.key === 'read').filtered.doc_count).toBe(2);
    expect(aggregations.find(a => a.key === 'write').filtered.doc_count).toBe(1);
  });

  it('should return aggregations of permission level filtered per current users group', async () => {
    userFactory.mock({ _id: user1, groups: [{ _id: group1 }, { _id: group2 }] });

    response = await search.search({ permissionsByLevel: true }, 'es');
    aggregations = response.aggregations.all.permissions.buckets;
    expect(aggregations.find(a => a.key === 'read').filtered.doc_count).toBe(2);
    expect(aggregations.find(a => a.key === 'write').filtered.doc_count).toBe(2);
  });
});
