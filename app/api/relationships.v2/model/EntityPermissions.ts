import { User } from './User';

interface StandardEntry {
  refId: string;
  type: 'user' | 'group';
  level: 'read' | 'write';
}

interface PublicEntry {
  refId: 'public';
  type: 'public';
  level: 'public';
}

type Entry = StandardEntry | PublicEntry;

export class EntityPermissions {
  readonly entity: string;

  readonly permissions: Entry[];

  constructor(entity: string, permissions: Entry[]) {
    this.entity = entity;
    this.permissions = permissions;
  }

  allowsPublicReads() {
    return this.permissions.some(permission => permission.level === 'public');
  }

  allowsUserTo(user: User, level: 'read' | 'write') {
    const idsForUser = user.groups.concat(user._id);

    return this.permissions.some(permission =>
      level === 'write'
        ? permission.level === 'write' && idsForUser.includes(permission.refId)
        : permission.level === 'public' || idsForUser.includes(permission.refId)
    );
  }
}
