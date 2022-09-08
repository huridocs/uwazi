type UserRole = 'admin' | 'editor' | 'collaborator';

export class User {
  readonly _id: string;

  readonly role: UserRole;

  constructor(_id: string, role: UserRole) {
    this._id = _id;
    this.role = role;
  }
}
