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

type NewGroup = Omit<Group, '_id'>;

type UserCreateRequests = NewUser;

type CreateUserResponse = { user: User };

type PostGroupCreateRequest = NewGroup;

type PostGroupCreateResponse = Group;

type GetUsersRequest = undefined;

type GetUsersResponse = {
  data: User[];
};

type GetUserByIdRequest = {
  id: string;
};

type GetUserByIdResponse = {
  data: User;
};

export type { CreateUserResponse };
