import { z } from 'zod';

type UserRole = 'admin' | 'editor' | 'collaborator';

const Schema = z.object({
  id: z.string().min(1),
  role: z.enum(['admin', 'editor', 'collaborator']),
  groups: z.array(z.string().min(1)),
});

type CreateFromProps = z.infer<typeof Schema>;

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

  isPublic() {
    return this._id === '__public__';
  }

  static public() {
    return new User('__public__', 'collaborator', []);
  }

  static createFrom(props: Partial<CreateFromProps>) {
    const parsed = Schema.parse(props);

    return new User(parsed.id, parsed.role, parsed.groups);
  }
}

export type { UserRole };
export { User };
