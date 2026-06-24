type Group = {
  _id: string;
  name: string;
};

type User = {
  _id: string;
  username: string;
  role: 'admin' | 'editor' | 'collaborator';
  email: string;
  using2fa?: boolean;
  accountLocked?: boolean;
  groups?: Group[];
};

type NewUser = Omit<User, '_id'> & { password?: string };

type CreateUserRequest = NewUser;

type CreateUserResponse = { user: Pick<User, '_id' | 'email' | 'role' | 'username'> };

export type { CreateUserResponse, CreateUserRequest };
