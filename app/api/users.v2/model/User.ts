type UserRole = 'admin' | 'editor' | 'collaborator';

class User {
  readonly _id: string;

  readonly role: UserRole;

  readonly groups: string[];

  constructor(_id: string, role: UserRole, groups: string[]) {
    this._id = _id;
    this.role = role;
    this.groups = groups;
  }

  isPrivileged() {
    return ['admin', 'editor'].includes(this.role);
  }
}

export type { UserRole };
export { User };
