import { z } from 'zod';

type UserRole = 'admin' | 'editor' | 'collaborator';

const Schema = z
  .object({
    _id: z
      .any()
      .transform(v => v?.toString())
      .pipe(z.string().min(1)),
    role: z.enum(['admin', 'editor', 'collaborator']),
    groups: z
      .array(
        z.union([
          z.string().min(1),
          z
            .object({ _id: z.any() })
            .passthrough()
            .transform(g => g._id?.toString() as string),
        ])
      )
      .default([]),
  })
  .passthrough();

class User {
  readonly _id: string | null;

  readonly role: UserRole;

  readonly groups: string[];

  constructor(_id: string | null, role: UserRole, groups: string[]) {
    this._id = _id;
    this.role = role;
    this.groups = groups;
  }

  isPrivileged() {
    return ['admin', 'editor'].includes(this.role);
  }

  isAnonymous() {
    return this._id === null;
  }

  private static anonymous() {
    return new User(null, 'collaborator', []);
  }

  static createFrom(props: { [key: string]: any } | null): User {
    if (!props) {
      return User.anonymous();
    }
    const parsed = Schema.parse(props);
    return new User(parsed._id, parsed.role, parsed.groups);
  }
}

export type { UserRole };
export { User };
