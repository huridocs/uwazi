import db from 'api/utils/testing_db';
import { search } from 'api/search/search';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
import { fixturesTimeOut } from './fixtures_elastic';
import { permissionsLevelFixtures, users } from './permissionsFiltersFixtures';
import { EntitySchema } from '../../../shared/types/entityType';

describe('Permissions filters', () => {
  const userFactory = new UserInContextMockFactory();

  beforeAll(async () => {
    await db.setupFixturesAndContext(permissionsLevelFixtures, 'permissionslevelfixtures');
    userFactory.restore();
  }, fixturesTimeOut);

  afterAll(async () => {
    await db.disconnect();
    userFactory.restore();
  });

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
