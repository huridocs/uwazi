import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoUsersQueryService } from '../mongodb/user/MongoUsersQueryService.js';
import { PostgresUserGroupsDAO } from '../postgresql/user/PostgresUserGroupsDAO.js';
import { PostgresUsersDAO } from '../postgresql/user/PostgresUsersDAO.js';
import { PostgresUsersQueryService } from '../postgresql/user/PostgresUsersQueryService.js';
import { UserGroupsDAOFactory } from './UserGroupsDAOFactory.js';
import { UsersDAOFactory } from './UsersDAOFactory.js';

class UsersQueryServiceFactory {
  // Requires postgresUsers AND postgresUsergroups to agree — listWithGroups joins users and
  // usergroups server-side, so both must live in the same backend for the join to be correct.
  // A mixed configuration is rejected rather than silently degraded: the Mongo branch below
  // takes its DAO from UsersDAOFactory, which would hand back a PostgresUsersDAO (the `as any`
  // casts hide the mismatch) and fail at query time with an opaque SQL error.
  static default(): MongoUsersQueryService {
    const tenant = ExecutionContext.currentTenant;
    const postgresUsers = Boolean(tenant.featureFlags?.postgresUsers);
    const postgresUsergroups = Boolean(tenant.featureFlags?.postgresUsergroups);

    if (postgresUsers !== postgresUsergroups) {
      throw new Error(
        'UsersQueryService requires the postgresUsers and postgresUsergroups feature flags to be ' +
          `enabled together, but got postgresUsers=${postgresUsers} and ` +
          `postgresUsergroups=${postgresUsergroups} for tenant "${tenant.name}".`
      );
    }

    if (postgresUsers) {
      return new PostgresUsersQueryService({
        usersDAO: UsersDAOFactory.default() as any as PostgresUsersDAO,
        userGroupsDAO: UserGroupsDAOFactory.default() as PostgresUserGroupsDAO,
      }) as any as MongoUsersQueryService;
    }

    return new MongoUsersQueryService({
      db: getConnection(),
      transactionManager: ExecutionContext.transactionManager,
      dao: UsersDAOFactory.default(),
    });
  }
}

export { UsersQueryServiceFactory };
