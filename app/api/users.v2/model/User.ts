import { Request } from 'express';

import { validateUserInputSchema } from 'api/users.v2/database/schemas/userValidators';

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

  isPrivileged() {
    return ['admin', 'editor'].includes(this.role);
  }

  static fromRequest = (request: Request): User => {
    const _user = request.user;
    if (validateUserInputSchema(_user)) {
      const id = _user._id.toHexString();
      const { role } = _user;
      const groups = _user.groups.map(g => g.name);
      const user = new User(id, role, groups);
      return user;
    }
    throw new Error('Invalid user in request.');
  };
}
