import { User } from 'api/users.v2/model/User';
import { PermissionsDataSource } from '../database/PermissionsDataSource';
import { UnauthorizedError } from '../errors/UnauthorizedError';

type AccessLevels = 'read' | 'write';

export class AuthorizationService {
  private authenticatedUser?: User;

  private permissionsDS: PermissionsDataSource;

  constructor(permissionsDS: PermissionsDataSource, authenticatedUser?: User) {
    this.permissionsDS = permissionsDS;
    this.authenticatedUser = authenticatedUser;
  }

  private isPrivileged() {
    return this.authenticatedUser && this.authenticatedUser.isPrivileged();
  }

  private getRelatedPermissionsSets(sharedIds: string[]) {
    return this.permissionsDS.getByEntities(sharedIds);
  }

  async isAuthorized(level: AccessLevels, sharedIds: string[]) {
    if (this.isPrivileged()) {
      return true;
    }

    const allEntitiesPermissions = this.getRelatedPermissionsSets(sharedIds);

    if (this.authenticatedUser) {
      const user = this.authenticatedUser;
      return allEntitiesPermissions.every(entityPermissions =>
        entityPermissions.allowsUserTo(user, level)
      );
    }

    return (
      level === 'read' &&
      allEntitiesPermissions.every(entityPermissions => entityPermissions.allowsPublicReads())
    );
  }

  async validateAccess(level: AccessLevels, sharedIds: string[]) {
    if (!(await this.isAuthorized(level, sharedIds))) {
      throw new UnauthorizedError('Not authorized');
    }
  }
}
