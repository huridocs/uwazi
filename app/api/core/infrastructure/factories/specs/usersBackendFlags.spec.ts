import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { MongoUsersDirectory } from '#api/core/infrastructure/mongodb/user/MongoUsersDirectory.js';
import { MongoUserGroupsDAO } from '#api/core/infrastructure/mongodb/user/MongoUserGroupsDAO.js';
import { MongoUsersQueryService } from '#api/core/infrastructure/mongodb/user/MongoUsersQueryService.js';
import { PostgresUsersDirectory } from '#api/core/infrastructure/postgresql/user/PostgresUsersDirectory.js';
import { PostgresUserGroupsDAO } from '#api/core/infrastructure/postgresql/user/PostgresUserGroupsDAO.js';
import { PostgresUsersQueryService } from '#api/core/infrastructure/postgresql/user/PostgresUsersQueryService.js';
import { UserGroupsDAOFactory } from '../UserGroupsDAOFactory.js';
import { UsersDirectoryFactory } from '../UsersDirectoryFactory.js';
import { UsersQueryServiceFactory } from '../UsersQueryServiceFactory.js';

/**
 * The both-flags-must-agree guard is shared by three factories (D8), so a regression in it
 * would be silent everywhere at once — hence one spec covering all three rather than a case
 * bolted onto whichever factory spec happened to exist.
 */
const factories = [
  { name: 'UsersDirectory', build: () => UsersDirectoryFactory.default() },
  { name: 'UsersQueryService', build: () => UsersQueryServiceFactory.default() },
  { name: 'UserGroupsDAO', build: () => UserGroupsDAOFactory.default() },
];

const runWithFlags = (
  build: () => unknown,
  featureFlags: { postgresUsers: boolean; postgresUsergroups: boolean }
) =>
  testingEnvironment.runWithContext(build, {
    tenant: { ...testingTenants.current(), featureFlags },
  });

describe('users backend resolution', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(factories)('$name', ({ name, build }) => {
    it.each([
      { postgresUsers: true, postgresUsergroups: false },
      { postgresUsers: false, postgresUsergroups: true },
    ])('should refuse a mixed configuration (%o)', flags => {
      expect(() => runWithFlags(build, flags)).toThrow(
        new RegExp(`^${name} requires the postgresUsers and postgresUsergroups feature flags`)
      );
    });
  });

  it('should build the mongo implementations when both flags are off', () => {
    const flags = { postgresUsers: false, postgresUsergroups: false };

    expect(runWithFlags(() => UsersDirectoryFactory.default(), flags)).toBeInstanceOf(
      MongoUsersDirectory
    );
    expect(runWithFlags(() => UsersQueryServiceFactory.default(), flags)).toBeInstanceOf(
      MongoUsersQueryService
    );
    expect(runWithFlags(() => UserGroupsDAOFactory.default(), flags)).toBeInstanceOf(
      MongoUserGroupsDAO
    );
  });

  it('should build the postgres implementations when both flags are on', () => {
    const flags = { postgresUsers: true, postgresUsergroups: true };

    expect(runWithFlags(() => UsersDirectoryFactory.default(), flags)).toBeInstanceOf(
      PostgresUsersDirectory
    );
    expect(runWithFlags(() => UsersQueryServiceFactory.default(), flags)).toBeInstanceOf(
      PostgresUsersQueryService
    );
    expect(runWithFlags(() => UserGroupsDAOFactory.default(), flags)).toBeInstanceOf(
      PostgresUserGroupsDAO
    );
  });
});
