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

type UserProfile = {
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

  updateProfile(profile: UserProfile): void {
    this.username = profile.username;
    this.role = profile.role;
    this.email = profile.email;
  }
}

export { User, UserRole, PUBLIC_USER_ID };
export type { UserProps, UserProfile };
