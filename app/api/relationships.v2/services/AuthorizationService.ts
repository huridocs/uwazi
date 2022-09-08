import { PermissionsDataSource } from '../database/PermissionsDataSource';
import { User } from '../model/User';
import { UnauthorizedError } from './UnauthorizedError';

type AccessLevels = 'read' | 'write';

export class AuthorizationService {
  private authenticatedUser?: User;

  private permissionsDS: PermissionsDataSource;

  constructor(permissionsDS: PermissionsDataSource, authenticatedUser?: User) {
    this.permissionsDS = permissionsDS;
    this.authenticatedUser = authenticatedUser;
  }

  async isAuthorized(level: AccessLevels, sharedIds: string[]) {
    if (this.authenticatedUser) {
      if (['admin', 'editor'].includes(this.authenticatedUser.role)) {
        return true;
      }

      const permissions = await Promise.all(
        sharedIds.map(async id => this.permissionsDS.getByEntity(id))
      );

      return permissions.every(
        permSet =>
          permSet &&
          permSet.find(
            perm =>
              perm.refId.toString() === this.authenticatedUser?._id &&
              (level === 'write' ? perm.level === 'write' : true)
          )
      );
    }

    return false;
  }

  async validateAccess(level: AccessLevels, sharedIds: string[]) {
    if (!(await this.isAuthorized(level, sharedIds))) {
      throw new UnauthorizedError('Not authorized');
    }
  }
}
