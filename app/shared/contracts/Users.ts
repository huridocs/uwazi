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

type PostUserCreateRequests = NewUser; // this needs admin password to validate but we are not sending it plainly in the request

type PostUserCreateResponse = User;

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

export type { GetUserByIdRequest, GetUserByIdResponse, GetUsersRequest, GetUsersResponse };
