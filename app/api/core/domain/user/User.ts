import { ObjectId } from 'mongodb';

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

  updateProfile(profile: UserProfileProps): void {
    this.username = profile.username;
    this.role = profile.role;
    this.email = profile.email;
  }
}

export { User, UserRole, PUBLIC_USER_ID };
export type { UserProps, UserProfileProps };
