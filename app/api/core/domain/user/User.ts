import { ObjectId } from 'mongodb';
import { z } from 'zod';

const PUBLIC_USER_ID = new ObjectId('698c35e7cf8880419d91fe4d');

enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  COLLABORATOR = 'collaborator',
}

type UserProps = {
  _id: string;
  username: string;
  role: UserRole;
  email: string;
};

/**
 * The editable identity fields, i.e. `updateProfile`'s argument. Named `...Props` rather
 * than `UserProfile` so it does not read as a sibling of the `UserProfile` read model in
 * `application/contracts/UserReadModels.ts` — that one is a read projection carrying
 * account state, this one is a write-side input.
 */
type UserProfileProps = {
  username: string;
  role: UserRole;
  email: string;
};

/** Partial profile: an `undefined` field means "leave it as it is". */
type UserProfilePatch = Partial<UserProfileProps>;

const PROFILE_FIELDS: (keyof UserProfileProps)[] = ['username', 'email', 'role'];

/** The invariants of a user's identity, whatever path created or changed it. */
const UserProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1)
    .refine(username => !username.includes(' '), 'Usernames can not contain spaces.'),
  role: z.nativeEnum(UserRole),
  email: z.string().email(),
});

/**
 * Validated on `create()` and on every `updateProfile()`. The constructor does not validate: it
 * is how stored users are loaded, and data written before these rules may not satisfy them.
 */
class User {
  readonly _id: string;

  username: string;

  role: UserRole;

  email: string;

  constructor(props: UserProps) {
    this._id = props._id;
    this.username = props.username;
    this.role = props.role;
    this.email = props.email;
  }

  static create(props: UserProps): User {
    return new User({ ...props, ...User.parseProfile(props) });
  }

  /**
   * Applies the defined fields of the patch, validating the resulting profile as a whole.
   * Nothing changes if it is invalid.
   */
  updateProfile(patch: UserProfilePatch): { changed: (keyof UserProfileProps)[] } {
    const current: UserProfileProps = {
      username: this.username,
      role: this.role,
      email: this.email,
    };
    const next = User.parseProfile({ ...current, ...User.definedFields(patch) });

    this.username = next.username;
    this.role = next.role;
    this.email = next.email;

    return { changed: PROFILE_FIELDS.filter(field => next[field] !== current[field]) };
  }

  protected static parseProfile(profile: UserProfileProps): UserProfileProps {
    return UserProfileSchema.parse(profile);
  }

  /** `{ ...a, ...b }` would overwrite with `undefined`; `null` is kept so validation sees it. */
  private static definedFields(patch: UserProfilePatch): UserProfilePatch {
    return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
  }
}

export { User, UserRole, PUBLIC_USER_ID };
export type { UserProps, UserProfileProps, UserProfilePatch };
