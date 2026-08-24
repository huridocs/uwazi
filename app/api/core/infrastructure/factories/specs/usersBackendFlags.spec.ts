import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { MongoUsersDirectory } from '#api/core/infrastructure/mongodb/user/MongoUsersDirectory.js';
import { MongoUsersQueryService } from '#api/core/infrastructure/mongodb/user/MongoUsersQueryService.js';
import { PostgresUsersDirectory } from '#api/core/infrastructure/postgresql/user/PostgresUsersDirectory.js';
import { PostgresUsersQueryService } from '#api/core/infrastructure/postgresql/user/PostgresUsersQueryService.js';
import { MongoUserGroupsDirectory } from '#api/core/infrastructure/mongodb/user/MongoUserGroupsDirectory.js';
import { MongoUserGroupsQueryService } from '#api/core/infrastructure/mongodb/user/MongoUserGroupsQueryService.js';
import { PostgresUserGroupsDirectory } from '#api/core/infrastructure/postgresql/user/PostgresUserGroupsDirectory.js';
import { PostgresUserGroupsQueryService } from '#api/core/infrastructure/postgresql/user/PostgresUserGroupsQueryService.js';
import { UserGroupsDirectoryFactory } from '../UserGroupsDirectoryFactory.js';
import { UserGroupsQueryServiceFactory } from '../UserGroupsQueryServiceFactory.js';
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
  { name: 'UserGroupsQueryService', build: () => UserGroupsQueryServiceFactory.default() },
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
    expect(runWithFlags(() => UserGroupsDirectoryFactory.default(), flags)).toBeInstanceOf(
      MongoUserGroupsDirectory
    );
    expect(runWithFlags(() => UserGroupsQueryServiceFactory.default(), flags)).toBeInstanceOf(
      MongoUserGroupsQueryService
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
    expect(runWithFlags(() => UserGroupsDirectoryFactory.default(), flags)).toBeInstanceOf(
      PostgresUserGroupsDirectory
    );
    expect(runWithFlags(() => UserGroupsQueryServiceFactory.default(), flags)).toBeInstanceOf(
      PostgresUserGroupsQueryService
    );
  });

  /**
   * The Directory is the one contract exempt from the both-flags rule: none of its methods
   * joins users, so it can serve a mixed configuration correctly and routes on
   * `postgresUsergroups` alone. If this ever starts throwing, the exemption was lost.
   */
  describe('UserGroupsDirectory', () => {
    it('should build the mongo implementation when only postgresUsers is on', () => {
      const flags = { postgresUsers: true, postgresUsergroups: false };

      expect(runWithFlags(() => UserGroupsDirectoryFactory.default(), flags)).toBeInstanceOf(
        MongoUserGroupsDirectory
      );
    });

    it('should build the postgres implementation when only postgresUsergroups is on', () => {
      const flags = { postgresUsers: false, postgresUsergroups: true };

      expect(runWithFlags(() => UserGroupsDirectoryFactory.default(), flags)).toBeInstanceOf(
        PostgresUserGroupsDirectory
      );
    });
  });
});
