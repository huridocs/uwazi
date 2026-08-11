import { PostgresUsersDAO } from './PostgresUsersDAO.js';
import { PostgresUserGroupsDAO } from './PostgresUserGroupsDAO.js';

type UserWithGroups = {
  _id: string;
  username: string;
  role: string;
  email: string;
  using2fa?: boolean;
  accountLocked?: boolean;
  groups: { _id: string; name: string }[];
};

type Deps = {
  usersDAO: PostgresUsersDAO;
  userGroupsDAO: PostgresUserGroupsDAO;
};

class PostgresUsersQueryService {
  private usersDAO: PostgresUsersDAO;

  private userGroupsDAO: PostgresUserGroupsDAO;

  constructor(deps: Deps) {
    this.usersDAO = deps.usersDAO;
    this.userGroupsDAO = deps.userGroupsDAO;
  }

  async listWithGroups(query: Record<string, unknown> = {}): Promise<UserWithGroups[]> {
    const users = await this.usersDAO.findMany({
      ...query,
      ...this.usersDAO.notPublicUserFilter(),
    });
    const groupsByUser = await this.userGroupsDAO.getGroupsByUserIds(users.map(u => u._id));

    return users.map(user => ({
      _id: user._id,
      username: user.username,
      role: user.role,
      email: user.email,
      using2fa: user.using2fa,
      accountLocked: user.accountLocked,
      groups: groupsByUser.get(user._id) ?? [],
    }));
  }
}

export { PostgresUsersQueryService };
