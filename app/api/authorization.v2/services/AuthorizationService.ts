import { User } from 'api/users.v2/model/User';
import { PermissionsDataSource } from '../contracts/PermissionsDataSource';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import { EntityPermissions } from '../model/EntityPermissions';
import { Relationship } from 'api/relationships.v2/model/Relationship';

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

  async filterEntities(level: AccessLevels, sharedIds: string[]): Promise<string[]> {
    if (this.isPrivileged()) {
      return sharedIds;
    }

    const allEntitiesPermissions = await this.getRelatedPermissionsSets(sharedIds).all();

    let filteredEntitiesPermissions: EntityPermissions[] = [];
    if (this.authenticatedUser) {
      const user = this.authenticatedUser;
      filteredEntitiesPermissions = allEntitiesPermissions.filter(entityPermissions =>
        entityPermissions.allowsUserTo(user, level)
      );
    } else {
      filteredEntitiesPermissions =
        level === 'read'
          ? allEntitiesPermissions.filter(entityPermissions =>
              entityPermissions.allowsPublicReads()
            )
          : [];
    }

    return filteredEntitiesPermissions.map(entityPermissions => entityPermissions.entity);
  }

  async filterRelationships(relationships: Relationship[], accessLevel: AccessLevels) {
    const involvedSharedIds: Set<string> = Relationship.getSharedIds(relationships);
    const allowedSharedIds = new Set(
      await this.filterEntities(accessLevel, [...involvedSharedIds])
    );
    const allowedRelationships = relationships.filter(
      relationship =>
        allowedSharedIds.has(relationship.from.entity) &&
        allowedSharedIds.has(relationship.to.entity)
    );
    return allowedRelationships;
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

export type { AccessLevels };
