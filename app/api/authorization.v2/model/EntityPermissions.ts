import { User } from 'api/users.v2/model/User';

interface Entry {
  refId: string;
  type: 'user' | 'group';
  level: 'read' | 'write';
}

class EntityPermissions {
  readonly entity: string;

  readonly permissions: Entry[];

  readonly published: boolean;

  constructor(entity: string, permissions: Entry[], published: boolean = false) {
    this.entity = entity;
    this.permissions = permissions;
    this.published = published;
  }

  allowsPublicReads() {
    return this.published;
  }

  allowsUserTo(user: User, level: 'read' | 'write') {
    const idsForUser = new Set(user.groups.concat(user._id));

    if (level === 'read') {
      return (
        this.published || this.permissions.some(permission => idsForUser.has(permission.refId))
      );
    }
    return this.permissions.some(
      permission => permission.level === 'write' && idsForUser.has(permission.refId)
    );
  }
}

export type { Entry };
export { EntityPermissions };
