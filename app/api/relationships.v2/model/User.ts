type UserRole = 'admin' | 'editor' | 'collaborator';

export class User {
  readonly _id: string;

  readonly role: UserRole;

  readonly groups: string[];

  constructor(_id: string, role: UserRole, groups: string[]) {
    this._id = _id;
    this.role = role;
    this.groups = groups;
  }
}
